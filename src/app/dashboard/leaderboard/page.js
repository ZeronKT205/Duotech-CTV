'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Award, Medal, ArrowUp, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Unused component removed

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="dash-topbar">
          <div>
            <h1 className="dash-page-title">
              <Trophy size={22} /> Bảng xếp hạng CTV
            </h1>
            <p className="dash-page-subtitle">Xem các cộng tác viên xuất sắc nhất hệ thống</p>
          </div>
        </div>
        <div className="dash-body">
          <div className="loading-page">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  // Separate Top 3 from the rest
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Re-order top 3 for physical podium layout: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 });

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <Trophy size={22} /> Bảng xếp hạng CTV
          </h1>
          <p className="dash-page-subtitle">Tôn vinh các cộng tác viên có hoạt động và doanh thu xuất sắc</p>
        </div>
      </div>

      <div className="dash-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Top 3 Podium Cards - Expanded Spacing ("giãn cái cup ra") */}
        {topThree.length > 0 && (
          <div className="leaderboard-podium-container">
            {podiumOrder.map((user) => {
              const height = user.rank === 1 ? '240px' : user.rank === 2 ? '200px' : '180px';
              const scale = user.rank === 1 ? '1.05' : '1';
              const medalIcon = user.rank === 1 ? '🏆' : user.rank === 2 ? '🥈' : '🥉';

              return (
                <div
                  key={user.name}
                  className={`podium-card-wrapper ${user.rank === 1 ? 'rank-1' : ''}`}
                  style={{
                    transform: `scale(${scale})`,
                    zIndex: user.rank === 1 ? 2 : 1
                  }}
                >
                  {/* Avatar & Medal Icon */}
                  <div className="podium-avatar-container">
                    <div
                      className="podium-avatar-wrapper"
                      style={{
                        width: user.rank === 1 ? '90px' : '76px',
                        height: user.rank === 1 ? '90px' : '76px'
                      }}
                    >
                      <img src={user.avatar} alt={user.name} />
                    </div>
                    <span className="podium-medal">
                      {medalIcon}
                    </span>
                  </div>

                  {/* Podium Stand */}
                  <div
                    className={`podium-stand rank-${user.rank}`}
                    style={{
                      height: height
                    }}
                  >
                    <span className="podium-user-name">
                      {user.name}
                    </span>
                    <span className="podium-user-amount">
                      {formatCurrency(user.totalAmount)}
                    </span>
                    <div className="podium-rank-badge">
                      #{user.rank}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard List */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <Award size={18} /> Top Danh Sách Xếp Hạng
            </h2>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            {remaining.length === 0 && topThree.length === 0 ? (
              <div className="empty-state">
                <Trophy size={48} />
                <h3>Chưa có bảng xếp hạng</h3>
              </div>
            ) : (
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Hạng</th>
                      <th>Cộng tác viên</th>
                      <th style={{ textAlign: 'right' }}>Hoa hồng tích lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remaining.map((user, index) => {
                      const rank = index + 4;
                      return (
                        <tr key={user.name}>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--dt-light-text-muted)', fontSize: '1rem' }}>
                            #{rank}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  border: '1px solid var(--dt-light-border)',
                                  backgroundColor: '#fff',
                                  flexShrink: 0
                                }}
                              >
                                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--dt-light-text-primary)' }}>
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--dt-green)', fontSize: '1rem' }}>
                            {formatCurrency(user.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
