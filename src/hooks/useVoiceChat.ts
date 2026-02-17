import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import { ref, set, onValue, push, remove, onDisconnect, get } from 'firebase/database';

// STUN servers are needed for WebRTC to work across different networks
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface VoiceChatState {
  isJoined: boolean;
  isMuted: boolean;
  speakingPlayers: Record<string, boolean>;
  toggleVoice: () => void;
  toggleMute: () => void;
}

export function useVoiceChat(roomId: string, playerId: string): VoiceChatState {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState<Record<string, boolean>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Record<string, AnalyserNode>>({});
  const animationFrameRef = useRef<number | null>(null);

  // Refs for cleanup to avoid closure staleness
  const roomIdRef = useRef(roomId);
  const playerIdRef = useRef(playerId);

  useEffect(() => {
    roomIdRef.current = roomId;
    playerIdRef.current = playerId;
  }, [roomId, playerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // We cannot call leaveVoice here because it's async and depends on state
      // Instead, we just cleanup refs.
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const cleanupPeer = (targetId: string) => {
    if (peerConnectionsRef.current[targetId]) {
      peerConnectionsRef.current[targetId].close();
      delete peerConnectionsRef.current[targetId];
    }
    if (analysersRef.current[targetId]) {
      delete analysersRef.current[targetId];
    }
    setSpeakingPlayers(prev => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  };

  const leaveVoice = useCallback(async () => {
    // 1. Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // 2. Close all peer connections
    Object.keys(peerConnectionsRef.current).forEach(targetId => {
      cleanupPeer(targetId);
    });

    // 3. Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 4. Remove self from Firebase
    const presenceRef = ref(db, `voice/${roomIdRef.current}/participants/${playerIdRef.current}`);
    await remove(presenceRef);
    const signalsRef = ref(db, `voice/${roomIdRef.current}/signals/${playerIdRef.current}`);
    await remove(signalsRef);

    setIsJoined(false);
    setIsMuted(false);
    setSpeakingPlayers({});
  }, []);

  const setupAudioAnalysis = (stream: MediaStream, id: string) => {
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analysersRef.current[id] = analyser;

    if (!animationFrameRef.current) {
      const checkVolume = () => {
        const speakingState: Record<string, boolean> = {};

        Object.entries(analysersRef.current).forEach(([pid, analyser]) => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          // Threshold for "speaking" (adjustable)
          const isSpeaking = average > 10;
          speakingState[pid] = isSpeaking;
        });

        setSpeakingPlayers(prev => {
          // Simple check to avoid unnecessary re-renders
          const isDifferent = Object.keys(speakingState).some(k => speakingState[k] !== prev[k]) ||
            Object.keys(prev).some(k => speakingState[k] === undefined);
          return isDifferent ? speakingState : prev;
        });

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    }
  };

  const createPeerConnection = (targetId: string, _initiator: boolean, stream: MediaStream) => {
    if (peerConnectionsRef.current[targetId]) return peerConnectionsRef.current[targetId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetId] = pc;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        push(ref(db, `voice/${roomIdRef.current}/signals/${targetId}/${playerIdRef.current}`), {
          type: 'candidate',
          candidate: JSON.stringify(event.candidate)
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setupAudioAnalysis(remoteStream, targetId);

      // Play audio
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(e => console.error("Error playing remote audio:", e));
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(targetId);
      }
    };

    return pc;
  };

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // Setup local audio analysis
      setupAudioAnalysis(stream, playerIdRef.current);

      setIsJoined(true);

      // Register presence
      const presenceRef = ref(db, `voice/${roomIdRef.current}/participants/${playerIdRef.current}`);
      await set(presenceRef, true);
      onDisconnect(presenceRef).remove();

      // Listen for signals sent TO me
      const mySignalsRef = ref(db, `voice/${roomIdRef.current}/signals/${playerIdRef.current}`);
      onValue(mySignalsRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Iterate over senders
        for (const [senderId, signals] of Object.entries(data)) {
          if (senderId === playerIdRef.current) continue;

          // Iterate over signals from this sender
          // Note: Firebase lists might be objects with push keys
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const [key, signal] of Object.entries(signals as Record<string, any>)) {
            if (!signal) continue;

            const pc = peerConnectionsRef.current[senderId] || createPeerConnection(senderId, false, stream);

            if (signal.type === 'offer') {
              if (pc.signalingState !== 'stable') continue; // Avoid race conditions
              await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.sdp)));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              push(ref(db, `voice/${roomIdRef.current}/signals/${senderId}/${playerIdRef.current}`), {
                type: 'answer',
                sdp: JSON.stringify(answer)
              });
            } else if (signal.type === 'answer') {
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.sdp)));
              }
            } else if (signal.type === 'candidate') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.candidate)));
              } catch (e) {
                console.error("Error adding ice candidate", e);
              }
            }

            // Remove processed signal to avoid reprocessing
            remove(ref(db, `voice/${roomIdRef.current}/signals/${playerIdRef.current}/${senderId}/${key}`));
          }
        }
      });

      // Check existing participants and initiate connection
      const participantsRef = ref(db, `voice/${roomIdRef.current}/participants`);
      const snapshot = await get(participantsRef);
      if (snapshot.exists()) {
        const participants = snapshot.val();
        for (const targetId of Object.keys(participants)) {
          if (targetId === playerIdRef.current) continue;

          const pc = createPeerConnection(targetId, true, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          push(ref(db, `voice/${roomIdRef.current}/signals/${targetId}/${playerIdRef.current}`), {
            type: 'offer',
            sdp: JSON.stringify(offer)
          });
        }
      }

      // Listen for new participants
      // The logic above handles existing.
      // Actually, 'child_added' might be better, but onValue is fine if we diff.
      // For simplicity, we rely on the fact that when THEY join, they will see US and send an offer.
      // So we don't strictly need to initiate connections to new joiners if they initiate to us.
      // But purely mesh usually implies "Initiator = New Joiner" OR "Initiator = Alphabetic sort".
      // Let's stick to "New Joiner initiates to everyone already there".

    } catch (error) {
      console.error("Error joining voice chat:", error);
      setIsJoined(false);
    }
  };

  const toggleVoice = () => {
    if (isJoined) {
      leaveVoice();
    } else {
      joinVoice();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return {
    isJoined,
    isMuted,
    speakingPlayers,
    toggleVoice,
    toggleMute
  };
}
