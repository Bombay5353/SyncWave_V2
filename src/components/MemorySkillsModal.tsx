import React, { useState } from 'react';
import {
  X,
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Cpu,
  Layers,
  Sliders,
  Shield,
  Code2,
  Zap,
  Terminal,
  Database,
  Book,
  FileCode,
  FileText,
  Search,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { AppSettings, UserMemoryItem, AiSkill } from '../types';
import { DEFAULT_SKILLS, DEFAULT_MEMORIES } from '../services/nvidiaApi';

interface MemorySkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  initialTab?: 'skills' | 'memories';
}

export const MemorySkillsModal: React.FC<MemorySkillsModalProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
  initialTab = 'skills',
}) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'memories'>(initialTab);

  // New/Edit Custom Skill state
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillTrigger, setSkillTrigger] = useState('');
  const [skillPrompt, setSkillPrompt] = useState('');
  const [skillKnowledge, setSkillKnowledge] = useState('');
  const [skillCategory, setSkillCategory] = useState<'coding' | 'analysis' | 'writing' | 'devops' | 'productivity' | 'custom'>('coding');

  // Search filter
  const [searchFilter, setSearchFilter] = useState('');

  // New Memory state
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<'preference' | 'persona' | 'workflow' | 'fact'>('preference');

  if (!isOpen) return null;

  const currentMemories: UserMemoryItem[] = settings.memories || DEFAULT_MEMORIES;
  const currentSkills: AiSkill[] = settings.skills || DEFAULT_SKILLS;

  // Toggle skill active state
  const handleToggleSkill = (skillId: string) => {
    const updated = currentSkills.map((s) =>
      s.id === skillId ? { ...s, isActive: !s.isActive } : s
    );
    updateSettings({ skills: updated });
  };

  const handleOpenAddSkill = () => {
    setIsEditingSkill(true);
    setEditingSkillId(null);
    setSkillName('');
    setSkillDesc('');
    setSkillTrigger('');
    setSkillPrompt('');
    setSkillKnowledge('');
    setSkillCategory('coding');
  };

  const handleEditSkill = (skill: AiSkill) => {
    setIsEditingSkill(true);
    setEditingSkillId(skill.id);
    setSkillName(skill.name);
    setSkillDesc(skill.description);
    setSkillTrigger(skill.triggerKeyword || '');
    setSkillPrompt(skill.systemPromptAddition);
    setSkillKnowledge(skill.referenceKnowledge || '');
    setSkillCategory(skill.category || 'coding');
  };

  const handleSaveSkill = () => {
    if (!skillName.trim() || !skillPrompt.trim()) return;

    const triggerClean = skillTrigger.trim().replace(/^\//, '').toLowerCase();

    if (editingSkillId) {
      // Update existing
      const updated = currentSkills.map((s) =>
        s.id === editingSkillId
          ? {
              ...s,
              name: skillName.trim(),
              description: skillDesc.trim() || 'Custom user directive',
              triggerKeyword: triggerClean || undefined,
              systemPromptAddition: skillPrompt.trim(),
              referenceKnowledge: skillKnowledge.trim() || undefined,
              category: skillCategory,
            }
          : s
      );
      updateSettings({ skills: updated });
    } else {
      // Create new
      const newSkill: AiSkill = {
        id: `custom-skill-${Date.now()}`,
        name: skillName.trim(),
        description: skillDesc.trim() || 'Custom user directive',
        triggerKeyword: triggerClean || skillName.trim().toLowerCase().replace(/\s+/g, '-'),
        systemPromptAddition: skillPrompt.trim(),
        referenceKnowledge: skillKnowledge.trim() || undefined,
        category: skillCategory,
        isActive: true,
        isBuiltIn: false,
        createdAt: Date.now(),
      };
      updateSettings({ skills: [...currentSkills, newSkill] });
    }

    setIsEditingSkill(false);
  };

  const handleDeleteSkill = (skillId: string) => {
    updateSettings({ skills: currentSkills.filter((s) => s.id !== skillId) });
  };

  // Add memory item
  const handleAddMemory = () => {
    if (!newMemoryContent.trim()) return;

    const newMem: UserMemoryItem = {
      id: `mem-${Date.now()}`,
      content: newMemoryContent.trim(),
      category: newMemoryCategory,
      createdAt: Date.now(),
    };

    updateSettings({ memories: [newMem, ...currentMemories] });
    setNewMemoryContent('');
  };

  const handleDeleteMemory = (memId: string) => {
    updateSettings({ memories: currentMemories.filter((m) => m.id !== memId) });
  };

  const handleResetMemories = () => {
    updateSettings({ memories: DEFAULT_MEMORIES });
  };

  const handleResetSkills = () => {
    updateSettings({ skills: DEFAULT_SKILLS });
  };

  const activeSkillsCount = currentSkills.filter((s) => s.isActive).length;

  const filteredSkills = currentSkills.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.triggerKeyword && s.triggerKeyword.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#090d16] border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#76b900]/15 border border-[#76b900]/30 flex items-center justify-center text-[#76b900]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Claude-Style Skills & Memory Engine</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Create & equip specialized agent skills utilized across Chat, Codex, and all LLM models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('skills');
              setIsEditingSkill(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'skills'
                ? 'bg-[#76b900] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AI Skills & Capabilities</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'skills' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {activeSkillsCount} active
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('memories');
              setIsEditingSkill(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'memories'
                ? 'bg-[#76b900] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Bank</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'memories' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {currentMemories.length} saved
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
          {activeTab === 'skills' && !isEditingSkill && (
            <div className="space-y-3">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search skills or slash triggers..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-slate-900 text-white rounded-lg pl-8 pr-3 py-1.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900]"
                  />
                </div>
                <button
                  onClick={handleOpenAddSkill}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Skill</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                Just like Claude, skills equip specialized domain expertise and rules. Use in chat via <code className="text-[#76b900] font-mono">/command</code>, select in the chat bar, or run directly in Codex Studio.
              </div>

              {/* Skills List */}
              <div className="space-y-2">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.id}
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      skill.isActive
                        ? 'bg-[#76b900]/10 border-[#76b900]/50 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-xs ${skill.isActive ? 'text-white' : 'text-slate-300'}`}>
                          {skill.name}
                        </span>

                        {skill.triggerKeyword && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-[#76b900] border border-slate-700">
                            /{skill.triggerKeyword}
                          </span>
                        )}

                        {skill.isBuiltIn ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Built-in
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Custom
                          </span>
                        )}

                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 uppercase">
                          {skill.category || 'coding'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {skill.description}
                      </p>

                      <div className="p-2 rounded bg-[#070b12] border border-slate-800/80 text-[10px] font-mono text-slate-400 line-clamp-2">
                        {skill.systemPromptAddition}
                      </div>

                      {skill.referenceKnowledge && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <FileText className="w-3 h-3 text-[#76b900]" />
                          <span>Includes reference knowledge base ({skill.referenceKnowledge.length} chars)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSkill(skill);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title="Edit Skill Directives"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {!skill.isBuiltIn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSkill(skill.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          title="Delete Custom Skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          skill.isActive
                            ? 'bg-[#76b900] text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-600 border border-slate-700'
                        }`}
                        title={skill.isActive ? 'Active: will be injected' : 'Click to equip'}
                      >
                        {skill.isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-slate-500">
                  Equipped skills apply automatically across AI Chat and Codex Studio.
                </span>
                <button
                  type="button"
                  onClick={handleResetSkills}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}

          {/* Add / Edit Skill View */}
          {activeTab === 'skills' && isEditingSkill && (
            <div className="space-y-3 p-1">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#76b900]" />
                  <span>{editingSkillId ? 'Edit Skill Directives' : 'Create Claude-Style Skill'}</span>
                </div>
                <button
                  onClick={() => setIsEditingSkill(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Back to Skills
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js App Router Master"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    className="w-full bg-slate-900 text-white rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                    Slash Trigger <span className="text-slate-500 font-normal">(type /trigger in chat)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono">/</span>
                    <input
                      type="text"
                      placeholder="e.g. nextjs"
                      value={skillTrigger}
                      onChange={(e) => setSkillTrigger(e.target.value)}
                      className="w-full bg-slate-900 text-white font-mono rounded-lg pl-6 pr-2.5 py-1.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                    Category
                  </label>
                  <select
                    value={skillCategory}
                    onChange={(e: any) => setSkillCategory(e.target.value)}
                    className="w-full bg-slate-900 text-white rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900]"
                  >
                    <option value="coding">Coding & Software Architecture</option>
                    <option value="analysis">Code Review & Security Audit</option>
                    <option value="writing">Technical Documentation & Docs</option>
                    <option value="devops">DevOps, Docker & Deployment</option>
                    <option value="productivity">Productivity & Conciseness</option>
                    <option value="custom">Custom Agent Directive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Enforces Server Components and Server Actions"
                    value={skillDesc}
                    onChange={(e) => setSkillDesc(e.target.value)}
                    className="w-full bg-slate-900 text-white rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  System Prompt Directive Instructions <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail how the AI must behave, code patterns to enforce, defensive handling, formatting style..."
                  value={skillPrompt}
                  onChange={(e) => setSkillPrompt(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg p-2.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900] resize-none leading-relaxed font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-[11px]">
                    Skill Reference Knowledge Base <span className="text-slate-500 font-normal">(Claude Project Knowledge)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Paste styleguide rules, API endpoints, database schemas, or corporate architecture constraints this skill references..."
                  value={skillKnowledge}
                  onChange={(e) => setSkillKnowledge(e.target.value)}
                  className="w-full bg-slate-900 text-white rounded-lg p-2.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900] resize-none leading-relaxed font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingSkill(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSkill}
                  disabled={!skillName.trim() || !skillPrompt.trim()}
                  className="px-4 py-1.5 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs disabled:opacity-50 shadow-sm"
                >
                  Save Skill
                </button>
              </div>
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-3.5">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Persistent memory remembers your preferences, coding conventions, and persona context. You never have to repeat yourself.
              </p>

              {/* Add Memory Input */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Remember New Preference</span>
                  <select
                    value={newMemoryCategory}
                    onChange={(e: any) => setNewMemoryCategory(e.target.value)}
                    className="bg-[#0a0d16] text-[11px] text-slate-300 rounded px-2 py-0.5 border border-slate-800 focus:outline-none"
                  >
                    <option value="preference">Preference</option>
                    <option value="workflow">Workflow</option>
                    <option value="persona">Persona</option>
                    <option value="fact">Fact</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Always write clean Python code using Pydantic and async/await."
                    value={newMemoryContent}
                    onChange={(e) => setNewMemoryContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMemory();
                      }
                    }}
                    className="flex-1 bg-[#0a0d16] text-white rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs focus:outline-none focus:border-[#76b900]"
                  />
                  <button
                    onClick={handleAddMemory}
                    disabled={!newMemoryContent.trim()}
                    className="px-3 py-1.5 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg disabled:opacity-50 shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Remember</span>
                  </button>
                </div>
              </div>

              {/* Memories List */}
              <div className="space-y-1.5">
                {currentMemories.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    No memories saved yet. Add your preferred language or formatting rules above.
                  </div>
                ) : (
                  currentMemories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-2.5 text-xs"
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-[#76b900] border border-slate-700">
                            {mem.category || 'preference'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(mem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed pt-0.5">{mem.content}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors shrink-0"
                        title="Delete this memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                <span>Injected automatically into all outgoing prompts</span>
                <button
                  type="button"
                  onClick={handleResetMemories}
                  className="hover:text-slate-300 underline"
                >
                  Reset Memories
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#76b900]" />
            <span>Active across all chats, models & Codex Studio</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#76b900] hover:bg-[#86d200] text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
