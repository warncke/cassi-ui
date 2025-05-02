import React, { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { startRecording, stopRecording } from "../../utils/voiceRecorder";
import { useTasks } from "../../providers/TaskProvider";

const RecordButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const { addTask, addTaskContext } = useTasks();

  const cleanup = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error("Error stopping MediaRecorder:", error);
        }
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (track.readyState === "live") {
          track.stop();
        }
      });
    }

    mediaRecorderRef.current = null;
    streamRef.current = null;

    setIsRecording(false);
    setRecordingTime(0);
    startTimeRef.current = 0;
  };

  const handleStartRecording = async () => {
    if (isRecording) {
      return;
    }

    try {
      const { recorder, stream } = await startRecording();

      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);

      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      cleanup();
      alert(
        "Could not access microphone. Please check permissions and try again."
      );
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    try {
      const recorder = mediaRecorderRef.current;
      const audioBlob = await stopRecording(recorder);

      if (audioBlob.size > 0) {
        addTask(
          `Processing voice command (${Math.round(audioBlob.size / 1024)} KB)`
        );
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    } finally {
      cleanup();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isRecording) {
        e.preventDefault();
        handleStartRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isRecording) {
        e.preventDefault();
        handleStopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording]);

  // Effect for component unmount cleanup
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []); // Empty dependency array ensures this runs only on unmount

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const jsonData = e.dataTransfer.getData("application/json");

    if (!jsonData) {
      console.warn("Dropped item does not contain application/json data.");
      return;
    }

    try {
      const data = JSON.parse(jsonData);
      if (data.type === "file" && data.path && data.content !== undefined) {
        await addTaskContext("file", {
          path: data.path,
          content: data.content,
        });
      } else if (data.type === "directory" && data.path) {
        await addTaskContext("directory", {
          path: data.path,
        });
      } else {
        console.warn("Dropped JSON data is missing expected properties:", data);
      }
    } catch (error) {
      console.error("Error processing dropped item:", error);
      alert("Failed to process the dropped item. Please ensure it's valid.");
    }
  };

  return (
    <div className="flex items-center">
      <button
        className={`flex items-center justify-center h-12 w-12 rounded-full transition-all duration-200 ${
          isDragOver
            ? "bg-blue-600 text-white scale-110"
            : isRecording
            ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
        onMouseDown={handleStartRecording}
        onMouseUp={handleStopRecording}
        onTouchStart={handleStartRecording}
        onTouchEnd={handleStopRecording}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Record voice command (press and hold Space)"
      >
        <Mic size={24} />
      </button>

      {isRecording && (
        <div className="ml-3 flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
          <span className="text-sm font-mono">{recordingTime}s</span>
        </div>
      )}
    </div>
  );
};

export default RecordButton;
