import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  CheckCircle,
  Copy,
  Check,
  Terminal,
  Zap,
  Layers,
  ArrowRight,
  Download,
  Key,
  Github,
  Package,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface GuideProps {
  roomId: string;
}

export const CrossPlatformGuideView: React.FC<GuideProps> = ({ roomId }) => {
  const { isInstallable, install } = usePWAInstall();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = `# 1. Initialize git and commit current files
git init
git add .
git commit -m "Initial commit for SyncWave Studio"

# 2. Add your GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/syncwave-ai-studio.git
git branch -M main
git push -u origin main`;

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto bg-[#080c14] p-4 sm:p-6 lg:p-10 space-y-8 max-w-5xl mx-auto pb-24 md:pb-12">
      {/* Title & Introduction */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/20 px-3 py-1 rounded-full">
          <span>Binary Deployment Blueprint</span>
          <span>·</span>
          <span>Windows .EXE & Android .APK via GitHub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          How to Get Native .APK & .EXE Binaries via GitHub
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Why Chrome PWA was provided first, and how you can now build and download the real standalone
          <strong> Windows .exe installer</strong> and <strong>Android .apk file</strong> directly from GitHub Releases.
        </p>
      </div>

      {/* Direct Answer: Why Chrome / PWA vs APK & EXE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0e1627] border border-slate-800 space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#76b900]" />
          <span>Why are .APK and .EXE not generated directly inside the browser sandbox?</span>
        </h2>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            1. <strong>Android .APK compilation</strong> requires the Google Android SDK, Java JDK 17, Android Build Tools, and Gradle (over 4 GB of toolchains).
          </p>
          <p>
            2. <strong>Windows .EXE compilation</strong> requires Microsoft Windows PE headers and packaging toolchains (like NSIS / Electron-Builder) that can only compile inside a Windows environment.
          </p>
          <p>
            3. Web preview sandboxes (like AI Studio) run in lightweight, isolated Linux web containers that do not have the Android SDK or Windows compilers pre-installed.
          </p>
          <p className="text-[#76b900] font-medium pt-1">
            ⚡ <strong>The Solution:</strong> We have added an automated <strong>GitHub Actions CI/CD workflow</strong> (<code className="text-white bg-slate-950 px-1.5 py-0.5 rounded">.github/workflows/build-release.yml</code>) to this project! When you push this project to GitHub, GitHub provides free cloud Windows and Android runners to compile the real binaries automatically!
          </p>
        </div>
      </div>

      {/* GitHub Actions Automated Workflow Hub */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-[#76b900]/40 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <Github className="w-5 h-5 text-white" />
            <span>Automated GitHub Actions Build Setup (Pre-configured)</span>
          </div>
          <span className="text-[11px] font-mono text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
            Ready to Build
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The file <code className="text-[#76b900] font-mono">.github/workflows/build-release.yml</code> is already created in your project. It compiles both binaries in the cloud whenever code is pushed:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Windows Job */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Monitor className="w-4 h-4 text-[#76b900]" />
              <span>Windows .EXE Runner (windows-latest)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Spins up a native Windows server in GitHub's cloud, runs Electron Builder, and outputs a standalone installer <code className="text-slate-200">SyncWave-Setup.exe</code> with desktop shortcut and icon.
            </p>
          </div>

          {/* Android Job */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Smartphone className="w-4 h-4 text-[#76b900]" />
              <span>Android .APK Runner (ubuntu-latest)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Spins up an Ubuntu runner equipped with JDK 17 & Android SDK 34, runs Capacitor & Gradle, and generates <code className="text-slate-200">app-debug.apk</code> ready to install on any Android phone.
            </p>
          </div>
        </div>

        {/* 3 Steps to trigger GitHub Release */}
        <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-3">
          <h3 className="font-semibold text-white text-xs flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#76b900] text-slate-950 flex items-center justify-center text-xs font-extrabold">
              1
            </span>
            <span>How to Build and Download from GitHub in 3 Steps:</span>
          </h3>

          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs pl-1 leading-relaxed">
            <li>
              Create a new repository on <strong className="text-white">GitHub.com</strong> (e.g., <code className="text-[#76b900]">syncwave-ai-studio</code>).
            </li>
            <li>
              Push this repository's files to your GitHub repo using git:
              <div className="mt-2 rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-[11px] font-mono text-slate-300 relative">
                <div className="flex justify-between items-center text-slate-500 pb-1 border-b border-slate-900 mb-1">
                  <span>Git Terminal Commands</span>
                  <button
                    onClick={() => handleCopy(gitCommands, 1)}
                    className="hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copiedIndex === 1 ? <Check className="w-3 h-3 text-[#76b900]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto text-[#76b900]">{gitCommands}</pre>
              </div>
            </li>
            <li>
              Go to your GitHub repository and click the <strong className="text-white">Actions</strong> tab. You will see the build running! Once finished, click <strong className="text-white">Releases</strong> on the right to download:
              <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-slate-400">
                <li><strong className="text-white">SyncWave-Setup.exe</strong> for your PC</li>
                <li><strong className="text-white">app-debug.apk</strong> for your Android device</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>

      {/* Local Building Option */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#76b900]" />
          <span>Alternative: Build Locally on Your Own Computer</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          If you have Node.js installed on your Windows PC, you can build the `.exe` right on your machine in 10 seconds:
        </p>
        <div className="rounded-lg bg-black/80 border border-slate-800 p-3 text-xs font-mono text-slate-300">
          <pre className="text-[#76b900] overflow-x-auto">
{`# On your Windows PC terminal:
npm install
npm run build
npx electron-builder --win`}
          </pre>
        </div>
      </div>

      {/* Sync Status Reminder */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>Both the compiled Windows .EXE and Android .APK will stay in real-time sync with Room: <strong className="font-mono text-[#76b900]">{roomId}</strong></span>
      </div>
    </div>
  );
};
