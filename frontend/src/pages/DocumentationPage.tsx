import { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit3,
  Calendar,
  Clock,
  User,
  FolderKanban,
  FileText,
  Trash2,
  CheckCircle2,
  X,
  ChevronRight,
  Code2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { docsApi, type DocItem } from '../lib/docs';
import { projectsApi, type Project } from '../lib/projects';

const CATEGORIES = [
  'ALL',
  'Architecture',
  'API & Backend',
  'CI/CD & Pipelines',
  'DevOps & Cloud',
  'Mobile & QA',
] as const;

export default function DocumentationPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('arch-overview');

  // New/Edit Doc Modal
  const [showModal, setShowModal] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocItem['category']>('Architecture');
  const [formContent, setFormContent] = useState('');

  useEffect(() => {
    projectsApi.getAll().then(setProjects).catch(() => {});
    loadDocs();
  }, []);

  const loadDocs = () => {
    const all = docsApi.getAll();
    setDocs(all);
    if (all.length > 0 && !selectedDocId) {
      setSelectedDocId(all[0].id);
    }
  };

  const selectedDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const handleOpenCreate = () => {
    setFormId(null);
    setFormTitle('');
    setFormCategory('Architecture');
    setFormContent('# Document Title\n\nProvide overview, architecture notes, or runbook steps here...');
    setShowModal(true);
  };

  const handleOpenEdit = (doc: DocItem) => {
    setFormId(doc.id);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormContent(doc.content);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const doc: DocItem = {
      id: formId || `doc-${Date.now()}`,
      title: formTitle,
      category: formCategory,
      lastUpdated: new Date().toISOString().slice(0, 10),
      author: user?.username || 'Team Member',
      readTime: `${Math.max(2, Math.ceil(formContent.split(' ').length / 150))} min read`,
      content: formContent,
    };

    docsApi.save(doc);
    setShowModal(false);
    loadDocs();
    setSelectedDocId(doc.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this documentation page?')) {
      docsApi.delete(id);
      loadDocs();
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar projects={projects} selectedProjectId={null} onSelectProject={() => {}} />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <BookOpen className="text-purple-400" size={28} /> Workspace Documentation Hub
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Centralized knowledge base, architecture design records (ADR), API references, and DevOps runbooks.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-purple-600/20 shrink-0"
            >
              <Plus size={16} /> New Document
            </button>
          </div>

          {/* Categories Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-[#0e0e14] border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Two-pane Documentation Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Doc Index */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredDocs.map((d) => {
                  const isSelected = selectedDoc?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDocId(d.id)}
                      className={`p-3.5 rounded-xl cursor-pointer border transition ${
                        isSelected
                          ? 'bg-purple-600/15 border-purple-500/40 text-purple-300'
                          : 'bg-[#12121a]/60 border-white/5 text-slate-400 hover:bg-[#12121a] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                          {d.category}
                        </span>
                        <span className="text-[10px] text-slate-500">{d.readTime}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1">{d.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                        <span>By {d.author}</span>
                        <span>•</span>
                        <span>{d.lastUpdated}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Doc Reader */}
            <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
              {selectedDoc ? (
                <div className="space-y-6">
                  {/* Article Header */}
                  <div className="border-b border-white/5 pb-6">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {selectedDoc.category}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(selectedDoc)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(selectedDoc.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 transition"
                          title="Delete doc"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedDoc.title}</h2>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                      <span className="flex items-center gap-1">
                        <User size={13} /> {selectedDoc.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> Updated {selectedDoc.lastUpdated}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {selectedDoc.readTime}
                      </span>
                    </div>
                  </div>

                  {/* Article Content Viewer */}
                  <div className="text-sm text-slate-300 space-y-4 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedDoc.content}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">Select a document to read.</div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create / Edit Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-purple-400" />
                {formId ? 'Edit Document' : 'Create Knowledge Document'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Document Title</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Microservice Deployment & Rollback Strategy"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Knowledge Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DocItem['category'])}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="Architecture">Architecture</option>
                  <option value="API & Backend">API & Backend</option>
                  <option value="CI/CD & Pipelines">CI/CD & Pipelines</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Mobile & QA">Mobile & QA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Markdown Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={12}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg p-4 text-xs text-white font-mono outline-none focus:border-purple-500 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-xs font-medium transition"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
