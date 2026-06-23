import VoiceIcon from "@/app/icons/voice.svg";
import VoiceOffIcon from "@/app/icons/voice-off.svg";
import PowerIcon from "@/app/icons/power.svg";

import styles from "./realtime-chat.module.scss";
import clsx from "clsx";

import { useState, useRef, useEffect } from "react";

import { useChatStore, createMessage, useAppConfig } from "@/app/store";

import { IconButton } from "@/app/components/button";

import {
  Modality,
  RTClient,
  RTInputAudioItem,
  RTResponse,
  TurnDetection,
} from "rt-client";
import { AudioHandler } from "@/app/lib/audio";
import { uploadImage } from "@/app/utils/chat";
import { VoicePrint } from "@/app/components/voice-print";
import Locale from "@/app/locales";

interface RealtimeChatProps {
  onClose?: () => void;
  onStartVoice?: () => void;
  onPausedVoice?: () => void;
}

export function RealtimeChat({
  onClose,
  onStartVoice,
  onPausedVoice,
}: RealtimeChatProps) {
  return useRealtimeChatView({ onClose, onStartVoice, onPausedVoice });
}

function useRealtimeChatView({
  onClose,
  onStartVoice,
  onPausedVoice,
}: RealtimeChatProps) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const [status, setStatus] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectingRef = useRef(false);
  const [modality, setModality] = useState("audio");
  const [useVAD, setUseVAD] = useState(true);
  const [frequencies, setFrequencies] = useState<Uint8Array | undefined>();

  const clientRef = useRef<RTClient | null>(null);
  const audioHandlerRef = useRef<AudioHandler | null>(null);
  const initRef = useRef(false);

  const temperature = config.realtimeConfig.temperature;
  const apiKey = config.realtimeConfig.apiKey;
  const model = config.realtimeConfig.model;
  const azure = config.realtimeConfig.provider === "Azure";
  const azureEndpoint = config.realtimeConfig.azure.endpoint;
  const azureDeployment = config.realtimeConfig.azure.deployment;
  const voice = config.realtimeConfig.voice;

  const handleConnect = async () => {
    if (isConnectingRef.current) return;
    if (!isConnected) {
      try {
        isConnectingRef.current = true;
        clientRef.current = azure
          ? new RTClient(
              new URL(azureEndpoint),
              { key: apiKey },
              { deployment: azureDeployment },
            )
          : new RTClient({ key: apiKey }, { model });
        const modalities: Modality[] =
          modality === "audio" ? ["text", "audio"] : ["text"];
        const turnDetection: TurnDetection = useVAD
          ? { type: "server_vad" }
          : null;
        await clientRef.current.configure({
          instructions: "",
          voice,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: turnDetection,
          tools: [],
          temperature,
          modalities,
        });
        startResponseListener();

        setIsConnected(true);
        // TODO
        // try {
        //   const recentMessages = chatStore.getMessagesWithMemory();
        //   for (const message of recentMessages) {
        //     const { role, content } = message;
        //     if (typeof content === "string") {
        //       await clientRef.current.sendItem({
        //         type: "message",
        //         role: role as any,
        //         content: [
        //           {
        //             type: (role === "assistant" ? "text" : "input_text") as any,
        //             text: content as string,
        //           },
        //         ],
        //       });
        //     }
        //   }
        //   // await clientRef.current.generateResponse();
        // } catch (error) {
        //   console.error("Set message failed:", error);
        // }
      } catch (error) {
        console.error("Connection failed:", error);
        setStatus("Connection failed");
      } finally {
        isConnectingRef.current = false;
      }
    } else {
      await disconnect();
    }
  };

  const disconnect = async () => {
    if (clientRef.current) {
      try {
        await clientRef.current.close();
        clientRef.current = null;
        setIsConnected(false);
      } catch (error) {
        console.error("Disconnect failed:", error);
      }
    }
  };

  const startResponseListener = async () => {
    if (!clientRef.current) return;

    try {
      for await (const serverEvent of clientRef.current.events()) {
        if (serverEvent.type === "response") {
          await handleResponse(serverEvent);
        } else if (serverEvent.type === "input_audio") {
          await handleInputAudio(serverEvent);
        }
      }
    } catch (error) {
      if (clientRef.current) {
        console.error("Response iteration error:", error);
      }
    }
  };

  const handleResponse = async (response: RTResponse) => {
    for await (const item of response) {
      if (item.type === "message" && item.role === "assistant") {
        const botMessage = createMessage({
          role: item.role,
          content: "",
        });
        // add bot message first
        chatStore.updateTargetSession(session, (session) => {
          session.messages = session.messages.concat([botMessage]);
        });
        let hasAudio = false;
        for await (const content of item) {
          if (content.type === "text") {
            for await (const text of content.textChunks()) {
              botMessage.content += text;
            }
          } else if (content.type === "audio") {
            const textTask = async () => {
              for await (const text of content.transcriptChunks()) {
                botMessage.content += text;
              }
            };
            const audioTask = async () => {
              audioHandlerRef.current?.startStreamingPlayback();
              for await (const audio of content.audioChunks()) {
                hasAudio = true;
                audioHandlerRef.current?.playChunk(audio);
              }
            };
            await Promise.all([textTask(), audioTask()]);
          }
          // update message.content
          chatStore.updateTargetSession(session, (session) => {
            session.messages = session.messages.concat();
          });
        }
        if (hasAudio) {
          // upload audio get audio_url
          const blob = audioHandlerRef.current?.savePlayFile();
          uploadImage(blob!).then((audio_url) => {
            botMessage.audio_url = audio_url;
            // update text and audio_url
            chatStore.updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          });
        }
      }
    }
  };

  const handleInputAudio = async (item: RTInputAudioItem) => {
    await item.waitForCompletion();
    if (item.transcription) {
      const userMessage = createMessage({
        role: "user",
        content: item.transcription,
      });
      chatStore.updateTargetSession(session, (session) => {
        session.messages = session.messages.concat([userMessage]);
      });
      // save input audio_url, and update session
      const { audioStartMillis, audioEndMillis } = item;
      // upload audio get audio_url
      const blob = audioHandlerRef.current?.saveRecordFile(
        audioStartMillis,
        audioEndMillis,
      );
      uploadImage(blob!).then((audio_url) => {
        userMessage.audio_url = audio_url;
        chatStore.updateTargetSession(session, (session) => {
          session.messages = session.messages.concat();
        });
      });
    }
    // stop streaming play after get input audio.
    audioHandlerRef.current?.stopStreamingPlayback();
  };

  const toggleRecording = async () => {
    if (!isRecording && clientRef.current) {
      try {
        if (!audioHandlerRef.current) {
          audioHandlerRef.current = new AudioHandler();
          await audioHandlerRef.current.initialize();
        }
        await audioHandlerRef.current.startRecording(async (chunk) => {
          await clientRef.current?.sendAudio(chunk);
        });
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    } else if (audioHandlerRef.current) {
      try {
        audioHandlerRef.current.stopRecording();
        if (!useVAD) {
          const inputAudio = await clientRef.current?.commitAudio();
          await Promise.all([
            handleInputAudio(inputAudio!),
            clientRef.current?.generateResponse(),
          ]);
        }
        setIsRecording(false);
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }
    }
  };

  const handleConnectRef = useRef(handleConnect);
  const toggleRecordingRef = useRef(toggleRecording);
  const disconnectRef = useRef(disconnect);

  useEffect(() => {
    handleConnectRef.current = handleConnect;
    toggleRecordingRef.current = toggleRecording;
    disconnectRef.current = disconnect;
  });

  useEffect(() => {
    // 防止重复初始化
    if (initRef.current) return;
    initRef.current = true;
    let audioHandler: AudioHandler | undefined;
    const disconnectRealtime = disconnectRef.current;

    const initAudioHandler = async () => {
      const handler = new AudioHandler();
      await handler.initialize();
      audioHandler = handler;
      audioHandlerRef.current = handler;
      await handleConnectRef.current();
      await toggleRecordingRef.current();
    };

    initAudioHandler().catch((error) => {
      setStatus(error);
      console.error(error);
    });

    return () => {
      audioHandler?.stopRecording();
      audioHandler?.close().catch(console.error);
      disconnectRealtime();
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    if (isConnected && isRecording) {
      const animationFrame = () => {
        if (audioHandlerRef.current) {
          const freqData = audioHandlerRef.current.getByteFrequencyData();
          setFrequencies(freqData);
        }
        animationFrameId = requestAnimationFrame(animationFrame);
      };

      animationFrameId = requestAnimationFrame(animationFrame);
    } else {
      setFrequencies(undefined);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isConnected, isRecording]);

  // update session params
  useEffect(() => {
    clientRef.current?.configure({ voice });
  }, [voice]);
  useEffect(() => {
    clientRef.current?.configure({ temperature });
  }, [temperature]);

  const handleClose = async () => {
    onClose?.();
    if (isRecording) {
      await toggleRecording();
    }
    disconnect().catch(console.error);
  };
  const realtimeStatusText =
    status ||
    (isConnected
      ? isRecording
        ? Locale.Settings.Realtime.Listening
        : Locale.Settings.Realtime.Ready
      : Locale.Settings.Realtime.Connecting);

  return (
    <div
      className={clsx(styles["realtime-chat"], {
        [styles["realtime-chat-recording"]]: isRecording,
        [styles["realtime-chat-connected"]]: isConnected,
      })}
      role="group"
      aria-label={Locale.Settings.Realtime.Enable.Title}
    >
      <div
        className={clsx(styles["circle-mic"], {
          [styles["pulse"]]: isRecording,
        })}
        aria-hidden="true"
      >
        <VoicePrint frequencies={frequencies} isActive={isRecording} />
      </div>

      <div className={styles["bottom-icons"]}>
        <div className={styles["icon-left"]}>
          <IconButton
            icon={isRecording ? <VoiceIcon /> : <VoiceOffIcon />}
            onClick={toggleRecording}
            disabled={!isConnected}
            className={styles["realtime-control-button"]}
            aria={
              isRecording
                ? Locale.Settings.Realtime.Pause
                : Locale.Settings.Realtime.Start
            }
            shadow
            bordered
          />
        </div>
        <div
          className={styles["icon-center"]}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {realtimeStatusText}
        </div>
        <div className={styles["icon-right"]}>
          <IconButton
            icon={<PowerIcon />}
            onClick={handleClose}
            className={styles["realtime-control-button"]}
            aria={Locale.UI.Close}
            shadow
            bordered
          />
        </div>
      </div>
    </div>
  );
}
