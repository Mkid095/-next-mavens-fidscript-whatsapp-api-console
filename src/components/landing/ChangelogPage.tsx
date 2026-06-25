import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, RefreshCw, Clock, GitCommit } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import { versionsApi, type DeployVersion } from '../../services/versions';

function parseChangelog(changelog: string | null): string[] {
  if (!changelog) return [];
  return changelog.split(';;').map((s) => s.trim()).filter(Boolean);
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChangelogPage() {
  const [versions, setVersions] = useState<DeployVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    versionsApi.getAll().then((res) => {
      if (res.success && res.data) setVersions(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Changelog — FIDScript WhatsApp API"
        description="FIDScript deployment history, product updates, and feature releases. See what is new across frontend, backend, and API versions."
        canonical="/changelog"
        schema="changelog"
        breadcrumbs={[{ name: 'Changelog', url: '/changelog' }]}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[#8a886a] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <img src="/logo.png" alt="FIDScript" className="h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">FIDSCRIPT</span>
              <span className="text-[9px] text-yellow-500">by Next Mavens</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Page hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
            <GitCommit className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-500">Deployment History</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Changelog</h1>
          <p className="text-[#8a886a]">
            Every update, feature, and fix — deployed to FIDScript in real time.
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : versions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#262413]" />

            <div className="space-y-6">
              {versions.map((v, idx) => {
                const commits = parseChangelog(v.changelog);
                const isLatest = idx === 0;
                const prev = v.previous_version || (isLatest ? null : null);

                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    className="relative pl-10"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 ${
                      isLatest
                        ? 'bg-yellow-500 border-yellow-500'
                        : 'bg-[#11110a] border-[#383416]'
                    }`} />

                    {/* Card */}
                    <div className={`bg-[#11110a] border rounded-2xl p-5 ${
                      isLatest ? 'border-yellow-500/30' : 'border-[#262413]'
                    }`}>
                      {/* Header row */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            {isLatest && <span className="px-2 py-0.5 bg-yellow-500 text-stone-950 text-[10px] font-bold rounded-full uppercase tracking-wider">Latest</span>}
                            <h2 className="text-lg font-bold text-white">
                              v{v.version}
                              {v.previous_version && v.previous_version !== '0.0.0' && (
                                <span className="text-[#6a6c5d] font-normal text-sm ml-2">
                                  ← v{v.previous_version}
                                </span>
                              )}
                            </h2>
                          </div>
                          <span className="px-2 py-0.5 bg-[#1a1910] border border-[#262413] text-[10px] text-[#6a6c5d] rounded-full uppercase tracking-wider">
                            {v.service}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#6a6c5d]">
                          <Clock className="w-3 h-3" />
                          <span title={formatDate(v.deployed_at)}>{timeAgo(v.deployed_at)}</span>
                        </div>
                      </div>

                      {/* Commit hash */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <GitCommit className="w-3 h-3 text-[#4a4a3a]" />
                        <span className="font-mono text-[10px] text-[#4a4a3a]">{v.commit_hash}</span>
                      </div>

                      {/* Summary */}
                      {v.changes_summary && (
                        <p className="text-sm text-[#a8a594] mb-4 leading-relaxed">
                          {v.changes_summary}
                        </p>
                      )}

                      {/* Commit list */}
                      {commits.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-2">
                            Changes in this deploy
                          </div>
                          {commits.slice(0, 8).map((commit, ci) => (
                            <div key={ci} className="flex items-start gap-2 text-xs text-[#8a886a]">
                              <span className="text-[#3d3a1e] mt-0.5 select-none">•</span>
                              <span>{commit}</span>
                            </div>
                          ))}
                          {commits.length > 8 && (
                            <div className="text-[10px] text-[#4a4a3a] italic pl-4">
                              +{commits.length - 8} more commits
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-[#6a6c5d] mb-4">
            Want early access to upcoming features?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-sm rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" />
            Start building for free
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#11110a] border border-[#262413] rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-20 bg-[#1a1910] rounded-full" />
            <div className="h-4 w-12 bg-[#1a1910] rounded-full" />
          </div>
          <div className="h-3 w-48 bg-[#1a1910] rounded mb-3" />
          <div className="space-y-2">
            <div className="h-2.5 w-full bg-[#1a1910] rounded" />
            <div className="h-2.5 w-3/4 bg-[#1a1910] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <RefreshCw className="w-10 h-10 text-[#262413] mx-auto mb-4" />
      <h3 className="text-white font-semibold mb-2">No deployments yet</h3>
      <p className="text-sm text-[#6a6c5d]">
        Deployment history will appear here once the first release is deployed.
      </p>
    </div>
  );
}
