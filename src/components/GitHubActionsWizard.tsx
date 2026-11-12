import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Github,
  PlayCircle,
  FileCode,
  Download,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const GitHubActionsWizard: React.FC = () => {
  const [keyAlias, setKeyAlias] = useState('mediadrop');
  const [keystorePassword, setKeystorePassword] = useState('MySecurePass123!');
  const [keyPassword, setKeyPassword] = useState('MySecurePass123!');
  const [copiedKeytool, setCopiedKeytool] = useState(false);
  const [copiedBase64Cmd, setCopiedBase64Cmd] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  // Command generators
  const keytoolCommand = `keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ${keyAlias} -storepass "${keystorePassword}" -keypass "${keyPassword}" -dname "CN=MediaDrop, OU=Mobile, O=Personal, L=City, S=State, C=US"`;

  const base64CommandLinux = `base64 -w 0 release.jks > keystore_base64.txt`;
  const base64CommandMac = `base64 -i release.jks | pbcopy`;
  const base64CommandWindows = `[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")) | Set-Clipboard`;

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Github className="w-4 h-4" />
            <span>Automated CI/CD Pipeline</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Signed Release APK with GitHub Actions</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Configure your release keystore secrets to automatically build, sign, and publish production-ready Android APKs on every commit or version tag.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Workflow Ready</span>
          </span>
        </div>
      </div>

      {/* Step by Step Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Generate Keystore */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
              <span>Step 1</span>
              <span>•</span>
              <span>Generate Keystore</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mt-1">Create Release Key (.jks)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Run this standard Java tool in your terminal to create your signing certificate.
            </p>

            {/* Configurable alias/password */}
            <div className="mt-4 space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-300">Key Alias</label>
                <input
                  type="text"
                  value={keyAlias}
                  onChange={(e) => setKeyAlias(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-300">Keystore Password</label>
                <input
                  type="text"
                  value={keystorePassword}
                  onChange={(e) => setKeystorePassword(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl relative group">
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                {keytoolCommand}
              </pre>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(keytoolCommand, setCopiedKeytool)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {copiedKeytool ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Command Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy keytool Command</span>
              </>
            )}
          </button>
        </div>

        {/* Step 2: Convert to Base64 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wide">
              <span>Step 2</span>
              <span>•</span>
              <span>Encode Certificate</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mt-1">Convert to Base64</h3>
            <p className="text-xs text-slate-400 mt-1">
              GitHub repository secrets only accept text. Convert your binary <code className="text-teal-300 font-mono">release.jks</code> to a base64 string.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] font-medium text-slate-300">Linux / Ubuntu:</span>
                <div className="mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 select-all">
                  {base64CommandLinux}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-300">macOS (auto-copy to clipboard):</span>
                <div className="mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 select-all">
                  {base64CommandMac}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-300">Windows PowerShell:</span>
                <div className="mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 select-all">
                  {base64CommandWindows}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(base64CommandLinux, setCopiedBase64Cmd)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {copiedBase64Cmd ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Linux Command Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Encoding Command</span>
              </>
            )}
          </button>
        </div>

        {/* Step 3: Add to GitHub Secrets */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
              <span>Step 3</span>
              <span>•</span>
              <span>Configure GitHub</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mt-1">Set 4 Repository Secrets</h3>
            <p className="text-xs text-slate-400 mt-1">
              In GitHub, go to <span className="text-slate-200 font-medium">Settings &gt; Secrets and variables &gt; Actions</span>.
            </p>

            <div className="mt-4 space-y-2">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-300">RELEASE_KEYSTORE_BASE64</div>
                  <div className="text-[10px] text-slate-400">Full base64 decoded string</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Secret</span>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-300">KEYSTORE_PASSWORD</div>
                  <div className="text-[10px] text-slate-400">{keystorePassword}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Secret</span>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-300">KEY_ALIAS</div>
                  <div className="text-[10px] text-slate-400">{keyAlias}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Secret</span>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-300">KEY_PASSWORD</div>
                  <div className="text-[10px] text-slate-400">{keyPassword}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Secret</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Workflow is already configured to automatically sign with these secrets!</span>
          </div>
        </div>
      </div>

      {/* GitHub Workflow Details & Triggers */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100">Workflow Execution (.github/workflows/build-signed-apk.yml)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              How the GitHub Runner builds and packages the signed APK
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
              Runner: ubuntu-latest (JDK 17)
            </span>
          </div>
        </div>

        {/* Pipeline Flow Steps */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl relative">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-200">Trigger on Push or Tag</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Triggered automatically on commits to <code className="text-indigo-300">main</code> or tags like <code className="text-indigo-300">v1.0.0</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl relative">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-200">Decode Keystore</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Runner extracts base64 secret into <code className="text-indigo-300">app/keystore/release.jks</code> in secure runner memory.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl relative">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-200">Gradle Release Build</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Executes <code className="text-indigo-300">./gradlew assembleRelease</code> with ProGuard R8 code shrinking and signing.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl relative">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-200">Upload & Release</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Attaches <code className="text-emerald-300">app-release.apk</code> to GitHub Actions Artifacts and publishes GitHub Release!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
