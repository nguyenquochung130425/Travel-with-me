import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../config/api';

const CHANNEL_STYLE = {
  ZALO: { bg: '#E0F2FE', text: '#0068FF', label: 'ZALO ZNS' },
  SMS: { bg: '#DCFCE7', text: '#059669', label: 'SMS BRANDNAME' },
  EMAIL: { bg: '#FEF3C7', text: '#D97706', label: 'EMAIL' },
  IN_APP: { bg: '#CCFBF1', text: '#0D9488', label: 'IN-APP CONCIERGE' }
};

export function NotificationsScreen({
  notifications,
  setNotifications,
  currentUser
}) {
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [simulating, setSimulating] = useState(false);

  const filtered = notifications.filter((n) => {
    if (selectedChannel === 'ALL') return true;
    return (n.channel || 'IN_APP').toUpperCase() === selectedChannel;
  });

  const handleSimulate24h = async (channel = 'ZALO') => {
    setSimulating(true);
    const res = await apiRequest('/api/notifications/simulate-reminder', {
      method: 'POST',
      body: JSON.stringify({
        userId: currentUser?.id || '3',
        bookingId: 'TWM-905128',
        channel
      })
    });
    setSimulating(false);

    const newNotif = res.ok && res.data?.data
      ? res.data.data
      : {
          id: Date.now(),
          type: 'TRIP_REMINDER_24H',
          channel,
          title: `⏰ [${channel}] Nhắc lịch khởi hành trước 24h`,
          message:
            'Đoàn khởi hành lúc 07:30 sáng mai tại Điểm hẹn trung tâm. HDV phụ trách: Anh Minh Tuấn (0909.888.999). Quý khách vui lòng chuẩn bị sẵn mã QR Boarding Pass!',
          is_read: 0,
          created_at: 'Vừa xong'
        };

    setNotifications((prev) => [newNotif, ...prev]);
    Alert.alert(
      `Đã gửi nhắc lịch 24h [${channel}]`,
      'Thông báo nhắc giờ khởi hành trước 24h đã được đẩy thành công lên thiết bị!'
    );
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    await apiRequest('/api/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ userId: currentUser?.id || '3' })
    });
  };

  const handleMarkOneRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>MULTI-CHANNEL NOTIFICATION HUB</Text>
            <Text style={styles.title}>Trung Tâm Thông Báo Đa Kênh</Text>
          </View>
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={15} color="#38BDF8" />
            <Text style={styles.markReadText}>Đọc tất cả</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subText}>
          Tự động hóa nhắc lịch khởi hành trước 24h qua Zalo ZNS, SMS Brandname, Email & In-App
        </Text>

        <View style={styles.simRow}>
          <TouchableOpacity
            style={styles.simZaloBtn}
            onPress={() => handleSimulate24h('ZALO')}
            disabled={simulating}
          >
            <Ionicons name="notifications" size={15} color="#FFFFFF" />
            <Text style={styles.simBtnText}>Test Nhắc Lịch 24h (Zalo ZNS)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simSmsBtn}
            onPress={() => handleSimulate24h('SMS')}
            disabled={simulating}
          >
            <Ionicons name="chatbox-ellipses" size={15} color="#FFFFFF" />
            <Text style={styles.simBtnText}>Test SMS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Channel Filter */}
      <View style={styles.filterRow}>
        {['ALL', 'ZALO', 'SMS', 'EMAIL', 'IN_APP'].map((ch) => (
          <TouchableOpacity
            key={ch}
            style={[styles.chip, selectedChannel === ch && styles.chipActive]}
            onPress={() => setSelectedChannel(ch)}
          >
            <Text style={[styles.chipText, selectedChannel === ch && styles.chipTextActive]}>
              {ch === 'ALL' ? 'Tất cả' : ch}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item.id || idx)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const chKey = (item.channel || 'IN_APP').toUpperCase();
          const st = CHANNEL_STYLE[chKey] || CHANNEL_STYLE.IN_APP;
          const unread = !item.is_read;

          return (
            <TouchableOpacity
              style={[styles.notifCard, unread && styles.notifCardUnread]}
              onPress={() => handleMarkOneRead(item.id)}
            >
              <View style={styles.notifHeader}>
                <View style={[styles.channelBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.channelText, { color: st.text }]}>{st.label}</Text>
                </View>
                <View style={styles.timeRow}>
                  {unread && <View style={styles.unreadDot} />}
                  <Text style={styles.timeText}>{item.created_at || 'Hôm nay'}</Text>
                </View>
              </View>

              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifMsg}>{item.message}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  topCard: {
    margin: 16,
    marginBottom: 10,
    backgroundColor: '#0A192F',
    borderRadius: 20,
    padding: 16
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kicker: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  markReadText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700'
  },
  subText: {
    color: '#94A3B8',
    fontSize: 12,
    marginVertical: 10,
    lineHeight: 17
  },
  simRow: {
    flexDirection: 'row',
    gap: 8
  },
  simZaloBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0068FF',
    paddingVertical: 10,
    borderRadius: 10
  },
  simSmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  simBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  chipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488'
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569'
  },
  chipTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 32
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  notifCardUnread: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF'
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  channelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  channelText: {
    fontSize: 10,
    fontWeight: '800'
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7'
  },
  timeText: {
    fontSize: 11,
    color: '#64748B'
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4
  },
  notifMsg: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18
  }
});

