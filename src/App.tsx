import React, { useState, useEffect, useMemo } from "react";
import { 
  Upload, Search, Grid, List as ListIcon, MoreVertical, 
  Copy, Trash2, Edit3, ExternalLink, LogOut, Check, Loader2, 
  FileText, Image as ImageIcon, File as FileIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) return <ImageIcon className="w-5 h-5" />;
  if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return <FileText className="w-5 h-5" />;
  return <FileIcon className="w-5 h-5" />;
};

const isImage = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "");
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-zinc-900 text-white hover:bg-zinc-800",
      secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50",
      danger: "bg-red-50 text-red-600 hover:bg-red-100",
      ghost: "hover:bg-zinc-100 text-zinc-600"
    };
    return (
      <button ref={ref} className={cn("px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2", variants[variant], className)} {...props} />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all", className)} {...props} />
  )
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/check");
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) setIsAuthenticated(true);
      else setError("Invalid password");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-zinc-100">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-zinc-900/20">
              <ExternalLink className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Stealth CDN</h1>
            <p className="text-zinc-500 mt-1">Enter password to access dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" placeholder="Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <Button className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}</Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ path: string, sha: string } | null>(null);
  const [renameConfirm, setRenameConfirm] = useState<{ path: string, sha: string, newName: string } | null>(null);
  const [renaming, setRenaming] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (res.ok) setFiles(data);
      else setConfigError(data.error || "Failed to fetch files");
    } catch {
      setConfigError("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e: any) => {
    const filesToUpload = e.target.files ? Array.from(e.target.files as FileList) : Array.from(e.dataTransfer.files as FileList);
    if (!filesToUpload.length) return;

    setUploadProgress({ current: 0, total: filesToUpload.length });
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, content: base64 }),
      });
      setUploadProgress({ current: i + 1, total: filesToUpload.length });
    }
    setUploadProgress(null);
    fetchFiles();
  };

  const filteredFiles = useMemo(() => files.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), [files, search]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg"><ExternalLink className="text-white w-5 h-5" /></div>
            <h1 className="text-xl font-bold hidden sm:block">Stealth CDN</h1>
          </div>
          <Button variant="ghost" onClick={onLogout}><LogOut className="w-4 h-4" /> Logout</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {configError ? (
          <div className="text-center p-8 bg-amber-50 rounded-2xl border border-amber-200">
            <h3 className="font-bold text-amber-900">Config Error</h3>
            <p className="text-amber-700">{configError}</p>
            <Button variant="secondary" className="mt-4" onClick={fetchFiles}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-white hover:border-zinc-300 relative mb-8">
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
              <Upload className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
              <p className="font-semibold">{uploadProgress ? `Uploading ${uploadProgress.current}/${uploadProgress.total}` : "Upload Assets"}</p>
            </div>
            <div className="flex gap-4 mb-8">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" /><Input placeholder="Search..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <div className="flex bg-white border rounded-lg p-1"><button onClick={() => setViewMode('grid')} className={cn("p-2 rounded", viewMode === 'grid' && "bg-zinc-100")}><Grid className="w-4 h-4" /></button><button onClick={() => setViewMode('list')} className={cn("p-2 rounded", viewMode === 'list' && "bg-zinc-100")}><ListIcon className="w-4 h-4" /></button></div>
            </div>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" : "bg-white border rounded-2xl overflow-hidden"}>
              {filteredFiles.map(file => viewMode === 'grid' ? 
                <FileCard key={file.sha} file={file} onDelete={(path, sha) => setDeleteConfirm({ path, sha })} onRename={(path, sha) => setRenameConfirm({ path, sha, newName: path })} /> : 
                <FileRow key={file.sha} file={file} onDelete={(path, sha) => setDeleteConfirm({ path, sha })} onRename={(path, sha) => setRenameConfirm({ path, sha, newName: path })} />
              )}
            </div>
          </>
        )}
      </main>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete File">
        <p className="mb-6">Delete {deleteConfirm?.path}?</p>
        <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={async () => { await fetch(`/api/files/${encodeURIComponent(deleteConfirm!.path)}?sha=${deleteConfirm!.sha}`, { method: "DELETE" }); setDeleteConfirm(null); fetchFiles(); }}>Delete</Button></div>
      </Modal>
    </div>
  );
}

function FileCard({ file, onDelete, onRename }: any) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-white rounded-xl border p-3 hover:shadow-md transition-all">
      <div className="aspect-square bg-zinc-50 rounded-lg overflow-hidden flex items-center justify-center mb-2 relative group">
        {isImage(file.name) ? <img src={file.download_url} className="w-full h-full object-cover" /> : getFileIcon(file.name)}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <button onClick={() => { navigator.clipboard.writeText(file.cdn_url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 bg-white rounded-full">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}</button>
          <a href={file.cdn_url} target="_blank" className="p-2 bg-white rounded-full"><ExternalLink className="w-4 h-4" /></a>
        </div>
      </div>
      <div className="flex justify-between items-center"><p className="text-sm font-medium truncate flex-1">{file.name}</p><button onClick={() => onDelete(file.path, file.sha)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button></div>
    </div>
  );
}

function FileRow({ file, onDelete }: any) {
  return (
    <div className="flex items-center p-4 border-b last:border-0 hover:bg-zinc-50">
      <div className="w-10 h-10 bg-zinc-100 rounded mr-3 flex items-center justify-center">{getFileIcon(file.name)}</div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-zinc-500">{formatSize(file.size)}</p></div>
      <button onClick={() => onDelete(file.path, file.sha)} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}