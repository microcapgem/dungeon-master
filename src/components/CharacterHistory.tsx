import { useState } from 'react';
import type { CampaignRecord } from '../game/state';

interface CharacterHistoryProps {
  campaigns: CampaignRecord[];
}

export function CharacterHistory({ campaigns }: CharacterHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (campaigns.length === 0) {
    return <p className="no-campaigns">No past campaigns yet.</p>;
  }

  return (
    <div className="campaign-history">
      {campaigns.slice().reverse().map(c => {
        const date = new Date(c.endDate).toLocaleDateString();
        const isExpanded = expandedId === c.id;

        return (
          <div key={c.id} className="campaign-record">
            <div
              className="campaign-header"
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
            >
              <div className="campaign-title-row">
                <span className="campaign-title">{c.title}</span>
                <span className="campaign-date">{date}</span>
              </div>
              <p className="campaign-summary-preview">
                {c.summary.length > 150 ? c.summary.slice(0, 150) + '...' : c.summary}
              </p>
              <div className="campaign-meta">
                {c.questsCompleted.length > 0 && (
                  <span className="campaign-meta-item">
                    {c.questsCompleted.length} quest{c.questsCompleted.length !== 1 ? 's' : ''}
                  </span>
                )}
                {c.npcsMet.length > 0 && (
                  <span className="campaign-meta-item">
                    {c.npcsMet.length} NPC{c.npcsMet.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="campaign-meta-item">{c.storyLog.length} entries</span>
                <span className="campaign-expand-hint">{isExpanded ? 'Hide log' : 'View full log'}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="campaign-full">
                <div className="campaign-full-summary">
                  <h4>Summary</h4>
                  <p>{c.summary}</p>
                </div>

                {c.questsCompleted.length > 0 && (
                  <div className="campaign-quests">
                    <h4>Quests</h4>
                    <ul>
                      {c.questsCompleted.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}

                {c.npcsMet.length > 0 && (
                  <div className="campaign-npcs">
                    <h4>NPCs Met</h4>
                    <p>{c.npcsMet.join(', ')}</p>
                  </div>
                )}

                <div className="campaign-log">
                  <h4>Adventure Log</h4>
                  <div className="campaign-log-entries">
                    {c.storyLog
                      .filter(e => e.type === 'dm' || e.type === 'player')
                      .map(entry => (
                        <div key={entry.id} className={`campaign-log-entry campaign-log-${entry.type}`}>
                          <span className="campaign-log-label">
                            {entry.type === 'dm' ? 'DM' : 'You'}:
                          </span>
                          <span className="campaign-log-text">{entry.text}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
