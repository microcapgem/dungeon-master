import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { listSaves, createSave, loadSave, deleteSave, overwriteSave } from '../utils/storage';
import type { SaveSlot } from '../utils/storage';

interface SaveLoadProps {
  onClose: () => void;
}

export function SaveLoad({ onClose }: SaveLoadProps) {
  const { state, dispatch } = useGame();
  const [saves, setSaves] = useState<SaveSlot[]>(listSaves());
  const [saveName, setSaveName] = useState('');
  const [tab, setTab] = useState<'save' | 'load'>('save');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState('');

  const canSave = state.character !== null;

  const handleSave = () => {
    if (!canSave) return;
    const name = saveName.trim() || `${state.character!.name} - ${new Date().toLocaleDateString()}`;
    createSave(name, state);
    setSaves(listSaves());
    setSaveName('');
    flash('Game saved!');
  };

  const handleOverwrite = (slot: SaveSlot) => {
    if (!canSave) return;
    overwriteSave(slot.id, slot.name, state);
    setSaves(listSaves());
    flash('Save overwritten!');
  };

  const handleLoad = (id: string) => {
    const loaded = loadSave(id);
    if (loaded) {
      dispatch({ type: 'LOAD_STATE', state: loaded });
      flash('Game loaded!');
      setTimeout(onClose, 600);
    }
  };

  const handleDelete = (id: string) => {
    deleteSave(id);
    setSaves(listSaves());
    setConfirmDelete(null);
    flash('Save deleted');
  };

  const flash = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2000);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="save-load-panel" onClick={(e) => e.stopPropagation()}>
        <button className="overlay-close" onClick={onClose}>{'\u2715'}</button>

        {/* Tabs */}
        <div className="sl-tabs">
          <button
            className={`sl-tab ${tab === 'save' ? 'active' : ''}`}
            onClick={() => setTab('save')}
          >
            Save Game
          </button>
          <button
            className={`sl-tab ${tab === 'load' ? 'active' : ''}`}
            onClick={() => setTab('load')}
          >
            Load Game
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="sl-notification">{notification}</div>
        )}

        {/* Save tab */}
        {tab === 'save' && (
          <div className="sl-content">
            {canSave ? (
              <div className="sl-new-save">
                <input
                  className="settings-input"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Save name (optional)"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button className="btn-primary" onClick={handleSave}>
                  Create Save
                </button>
              </div>
            ) : (
              <p className="sl-empty">Start an adventure first to save your game.</p>
            )}

            {saves.length > 0 && canSave && (
              <>
                <div className="sl-divider">Or overwrite an existing save</div>
                <div className="sl-list">
                  {saves.map(slot => (
                    <div key={slot.id} className="sl-slot">
                      <div className="sl-slot-info">
                        <div className="sl-slot-name">{slot.name}</div>
                        <div className="sl-slot-meta">
                          {slot.characterName} &middot; {capitalize(slot.characterClass)} Lv.{slot.level} &middot; {slot.location}
                        </div>
                        <div className="sl-slot-date">{formatDate(slot.timestamp)} &middot; {slot.storyLength} entries</div>
                      </div>
                      <div className="sl-slot-actions">
                        <button className="sl-btn sl-btn-overwrite" onClick={() => handleOverwrite(slot)}>
                          Overwrite
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Load tab */}
        {tab === 'load' && (
          <div className="sl-content">
            {saves.length === 0 ? (
              <p className="sl-empty">No saved games yet. Start an adventure and save your progress!</p>
            ) : (
              <div className="sl-list">
                {saves.map(slot => (
                  <div key={slot.id} className="sl-slot">
                    <div className="sl-slot-info">
                      <div className="sl-slot-name">{slot.name}</div>
                      <div className="sl-slot-meta">
                        {slot.characterName} &middot; {capitalize(slot.characterClass)} Lv.{slot.level} &middot; {slot.location}
                      </div>
                      <div className="sl-slot-date">{formatDate(slot.timestamp)} &middot; {slot.storyLength} entries</div>
                    </div>
                    <div className="sl-slot-actions">
                      <button className="sl-btn sl-btn-load" onClick={() => handleLoad(slot.id)}>
                        Load
                      </button>
                      {confirmDelete === slot.id ? (
                        <button className="sl-btn sl-btn-confirm-delete" onClick={() => handleDelete(slot.id)}>
                          Confirm?
                        </button>
                      ) : (
                        <button className="sl-btn sl-btn-delete" onClick={() => setConfirmDelete(slot.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
