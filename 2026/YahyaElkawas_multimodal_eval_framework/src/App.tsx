import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Image, FileText, BarChart3 } from "lucide-react";

interface EvalStep {
  id?: string;
  type: "text" | "image" | "audio" | "video" | "pdf" | "result" | "metric";
  content: string;
  label?: string;
  score?: number;
  timestamp?: string;
}

const BenchmarkUI = () => {
  const [steps, setSteps] = useState<EvalStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startEvaluation = () => {
    setSteps([]);
    setProgress(0);
    setIsRunning(true);

    const eventSource = new EventSource(
      "http://127.0.0.1:8000/evaluate-multimodal",
    );

    eventSource.onmessage = (event) => {
      const data: EvalStep = JSON.parse(event.data);

      setSteps((prev) => [
        ...prev,
        { ...data, timestamp: new Date().toLocaleTimeString() },
      ]);

      setProgress((prev) => Math.min(prev + 10, 100));

      if (data.type === "result") {
        eventSource.close();
        setIsRunning(false);
        setProgress(100);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsRunning(false);
    };
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image size={16} />;
      case "video":
        return <Play size={16} />;
      case "pdf":
        return <FileText size={16} />;
      case "metric":
        return <BarChart3 size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            🧠 Multimodal Eval Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time agent evaluation & observability
          </p>
        </div>

        <button
          onClick={startEvaluation}
          disabled={isRunning}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            padding: "12px 24px",
            marginBottom: "20px",
            border: "2px solid #444444",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: isRunning ? "not-allowed" : "pointer",
            opacity: isRunning ? 0.7 : 1,
            transition: "0.2s",
            fontWeight: "600",
            margin: "auto",
            marginTop: "10px",
          }}
        >
          {isRunning ? (
            <>
              <span className="animate-spin">⚙️</span> Running...
            </>
          ) : (
            "Start Evaluation"
          )}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-10">
        <div
          style={{ margin: "10px" }}
          className="flex justify-between text-sm text-gray-400 mb-2"
        >
          <span>Progress</span>
          <span>{progress}%</span>
        </div>

        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-green-400"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="relative border-l border-gray-800 pl-6 space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            {/* Dot */}
            <div className="absolute -left-[30px] top-2 w-3 h-3 bg-indigo-500 rounded-full shadow-lg" />

            <div className="bg-gray-900/70 backdrop-blur-xl p-5 rounded-2xl border border-gray-800 shadow-xl hover:shadow-indigo-500/10 transition">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {getIcon(step.type)}
                  <span>{step.label || step.type}</span>
                </div>
                <span className="text-xs text-gray-500">{step.timestamp}</span>
              </div>

              {step.type === "text" && (
                <p className="text-sm leading-relaxed text-gray-200">
                  {step.content}
                </p>
              )}

              {step.type === "image" && (
                <img
                  src={
                    step.content.startsWith("http")
                      ? step.content
                      : `data:image/png;base64,${step.content}`
                  }
                  className="w-full max-w-md h-40 object-cover rounded-xl border border-gray-700 mx-auto"
                />
              )}

              {step.type === "audio" && (
                <audio controls src={step.content} className="w-full" />
              )}

              {step.type === "video" && (
                <video
                  controls
                  src={step.content}
                  className="rounded-xl w-full max-h-60"
                />
              )}

              {step.type === "pdf" && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(step.content)}&embedded=true`}
                  className="w-full h-72 rounded-xl border border-gray-700"
                />
              )}

              {step.type === "metric" && (
                <div className="bg-gray-800 p-4 rounded-xl text-center">
                  <p className="text-xs text-gray-400">{step.label}</p>
                  <p className="text-2xl font-bold mt-1 text-indigo-400">
                    {step.content}
                  </p>
                </div>
              )}

              {step.type === "result" && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-xl text-center">
                  <p className="font-bold text-lg">{step.content}</p>
                  <p className="text-sm mt-1">
                    Confidence: {(step.score! * 100).toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BenchmarkUI;
