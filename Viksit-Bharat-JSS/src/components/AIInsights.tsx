import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
  key_topics?: string[];
  risk_flags?: string[];
  ai_summary?: string;
  last_analyzed_at?: string;
}

interface AIInsightsProps {
  projects: Project[];
  onAnalyzeProject: (projectId: string, text: string) => Promise<void>;
}

export default function AIInsights({ projects, onAnalyzeProject }: AIInsightsProps) {
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const getSentimentIcon = (label?: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSentimentColor = (label?: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleAnalyze = async (project: Project) => {
    setAnalyzing(project.id);
    try {
      await onAnalyzeProject(project.id, project.description);
    } finally {
      setAnalyzing(null);
    }
  };

  const analyzedProjects = projects.filter(p => p.sentiment_label);
  const unanalyzedProjects = projects.filter(p => !p.sentiment_label);
  const allRiskFlags = analyzedProjects.flatMap(p => p.risk_flags || []);
  const uniqueRiskFlags = Array.from(new Set(allRiskFlags));

  const avgSentiment = analyzedProjects.length > 0
    ? (analyzedProjects.reduce((sum, p) => sum + (p.sentiment_score || 0), 0) / analyzedProjects.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Sentiment</p>
              <p className="text-2xl font-bold mt-1">
                {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
              </p>
            </div>
            <Brain className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projects Analyzed</p>
              <p className="text-2xl font-bold mt-1">
                {analyzedProjects.length} / {projects.length}
              </p>
            </div>
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Risk Flags Detected</p>
              <p className="text-2xl font-bold mt-1">{allRiskFlags.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Active Risk Flags */}
      {uniqueRiskFlags.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-orange-300">
          <div className="p-4 bg-orange-50 border-b border-orange-300">
            <h3 className="font-semibold text-orange-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Risk Flags
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {uniqueRiskFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded-full text-sm font-medium"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Project Insights */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Project Analysis</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {analyzedProjects.map((project) => (
            <div key={project.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  {project.last_analyzed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Analyzed: {new Date(project.last_analyzed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 border rounded-lg ${getSentimentColor(project.sentiment_label)}`}>
                  {getSentimentIcon(project.sentiment_label)}
                  <span className="text-sm font-medium capitalize">{project.sentiment_label}</span>
                </div>
              </div>

              {project.ai_summary && (
                <p className="text-sm text-gray-700 mb-3 italic">"{project.ai_summary}"</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {project.key_topics && project.key_topics.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Topics:</span>
                    <div className="flex gap-1">
                      {project.key_topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.risk_flags && project.risk_flags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Risks:</span>
                    <div className="flex gap-1">
                      {project.risk_flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded text-xs"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAnalyze(project)}
                disabled={analyzing === project.id}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
              >
                {analyzing === project.id ? 'Re-analyzing...' : 'Re-analyze'}
              </button>
            </div>
          ))}

          {unanalyzedProjects.length > 0 && (
            <>
              <div className="p-4 bg-gray-50">
                <h4 className="font-medium text-gray-700">Pending Analysis</h4>
              </div>
              {unanalyzedProjects.map((project) => (
                <div key={project.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                  </div>
                  <button
                    onClick={() => handleAnalyze(project)}
                    disabled={analyzing === project.id}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium whitespace-nowrap"
                  >
                    {analyzing === project.id ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
