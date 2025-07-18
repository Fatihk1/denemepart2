import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';

const cardData = [
  {
    title: 'Raporlarım',
    description: 'Oluşturduğunuz ve size atanan tüm raporları görüntüleyin.',
    icon: '📄',
    emoji: '📄',
    bgClass: 'bg-gradient-to-br from-blue-400 to-blue-600',
    textColor: 'text-white',
    actionLabel: 'İncele',
    onClick: null,
  },
  {
    title: 'Firmalarım',
    description: 'Eklediğiniz tüm firmaları görüntüleyin.',
    icon: '🏢',
    emoji: '🏢',
    bgClass: 'bg-gradient-to-br from-green-400 to-green-600',
    textColor: 'text-white',
    actionLabel: 'Görüntüle',
    onClick: (navigate) => navigate('/my-companies'),
  },
  {
    title: 'AI Raportör',
    description: 'Yapay zeka destekli otomatik rapor oluşturucu ile tanışın.',
    icon: '🤖',
    emoji: '🤖',
    bgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    textColor: 'text-white',
    actionLabel: 'Başlat',
    onClick: (navigate) => navigate('/ai-reporter'),
    special: true,
  },
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('name, user_type')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar 
              label={profile.name.charAt(0).toUpperCase()} 
              size="xlarge" 
              shape="circle" 
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl border-4 border-white" 
              style={{ width: '80px', height: '80px', fontSize: '2rem' }}
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Hoşgeldin, {profile.name}! 👋</h1>
              <Tag 
                value={profile.user_type === 'employer' ? '👔 İşveren/Vekili' : '🔬 ISG Uzmanı'} 
                severity={profile.user_type === 'employer' ? 'info' : 'success'} 
                className="text-lg px-4 py-2 font-semibold shadow-lg" 
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cardData.map((card, idx) => (
            <div key={idx} className="transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className={`${card.bgClass} rounded-3xl p-6 shadow-xl border-2 border-white/20 backdrop-blur-sm ${card.textColor} relative overflow-hidden`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className={`text-6xl mb-4 ${card.special ? 'animate-pulse' : ''}`}>
                      {card.emoji}
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                    <p className="text-sm opacity-90 leading-relaxed">{card.description}</p>
                  </div>
                  
                  <div className="mt-6">
                    <Button
                      label={card.actionLabel}
                      className="w-full bg-white/20 hover:bg-white/30 border-2 border-white/30 text-white font-semibold py-3 px-6 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                      onClick={card.onClick ? () => card.onClick(navigate) : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="font-semibold text-gray-800">Toplam Rapor</h3>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏭</div>
              <div>
                <h3 className="font-semibold text-gray-800">Aktif Firma</h3>
                <p className="text-2xl font-bold text-green-600">5</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="font-semibold text-gray-800">AI Rapor</h3>
                <p className="text-2xl font-bold text-purple-600">3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 