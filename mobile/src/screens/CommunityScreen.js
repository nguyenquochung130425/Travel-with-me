import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileLocale } from '../context/MobileLocaleContext';
import { apiRequest } from '../config/api';

const LOCATION_TAGS = ['Tất cả', 'Vịnh Hạ Long', 'Sa Pa', 'Phú Quốc', 'Du Thuyền', 'Trekking'];

export function CommunityScreen({
  posts,
  setPosts,
  tours,
  currentUser,
  onJumpToTour
}) {
  const { formatPrice, t } = useMobileLocale();
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Story State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTips, setNewTips] = useState('');
  const [newTags, setNewTags] = useState('Vịnh Hạ Long,Du Thuyền');
  const [selectedTourId, setSelectedTourId] = useState(tours[0]?.id || 'tour-halong-1');

  const filteredPosts = useMemo(() => {
    if (selectedTag === 'Tất cả') return posts;
    const kw = selectedTag.toLowerCase();
    return posts.filter(
      (p) =>
        (p.location_tags || '').toLowerCase().includes(kw) ||
        (p.title || '').toLowerCase().includes(kw)
    );
  }, [posts, selectedTag]);

  const handleOpenPost = async (post) => {
    setActivePost(post);
    setComments([
      {
        id: 1,
        author_name: 'Phạm Thu Hà',
        content: 'Bài viết chi tiết quá! Mình cũng vừa đi lịch trình này tuần trước, cực kỳ ưng ý.',
        created_at: '2 giờ trước'
      }
    ]);
    const res = await apiRequest(`/api/community/posts/${post.id}`);
    if (res.ok && Array.isArray(res.data?.data?.comments)) {
      setComments(res.data.data.comments);
    }
  };

  const handleLikePost = async (post) => {
    const updatedCount = (Number(post.likes_count) || 0) + 1;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes_count: updatedCount } : p))
    );
    if (activePost?.id === post.id) {
      setActivePost((prev) => ({ ...prev, likes_count: updatedCount }));
    }
    await apiRequest(`/api/community/posts/${post.id}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId: currentUser?.id || '3' })
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !activePost) return;
    const newComment = {
      id: Date.now(),
      author_name: currentUser?.fullName || 'Nguyễn Quốc Hùng',
      content: commentText.trim(),
      created_at: 'Vừa xong'
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    setPosts((prev) =>
      prev.map((p) =>
        p.id === activePost.id
          ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 }
          : p
      )
    );
    await apiRequest(`/api/community/posts/${activePost.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        userId: currentUser?.id || '3',
        authorName: newComment.author_name,
        content: newComment.content
      })
    });
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung câu chuyện hành trình.');
      return;
    }
    const linkedTour = tours.find((tr) => tr.id === selectedTourId) || tours[0];
    const payload = {
      userId: currentUser?.id || '3',
      authorName: currentUser?.fullName || 'Nguyễn Quốc Hùng',
      title: newTitle.trim(),
      summary: newSummary.trim() || newContent.trim().slice(0, 120),
      content: newContent.trim(),
      travelTips: newTips.trim() || 'Đặt sớm trước 7 ngày để giữ hạng phòng đẹp nhất.',
      locationTags: newTags,
      tourId: linkedTour?.id || 'tour-halong-1',
      tripBadge: 'Đã xác thực hành trình trên Expo Go',
      thumbnailUrl:
        linkedTour?.image ||
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80'
    };

    const res = await apiRequest('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const created = res.ok && res.data?.data
      ? res.data.data
      : {
          id: Date.now(),
          title: payload.title,
          summary: payload.summary,
          content: payload.content,
          author_name: payload.authorName,
          thumbnail_url: payload.thumbnailUrl,
          trip_badge: payload.tripBadge,
          travel_tips: payload.travelTips,
          location_tags: payload.locationTags,
          tour_id: payload.tourId,
          tour_title: linkedTour?.title || 'Du Thuyền 5 Sao Vịnh Hạ Long',
          adult_price: linkedTour?.price || 3450000,
          likes_count: 1,
          comments_count: 0,
          created_at: 'Vừa xong'
        };

    setPosts((prev) => [created, ...prev]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewTips('');
    Alert.alert('Đã xuất bản 🎉', 'Nhật ký hành trình của bạn đã được đăng lên Cộng đồng Du lịch!');
  };

  const renderStoryCard = ({ item }) => {
    const tags = (item.location_tags || 'Việt Nam').split(',').map((s) => s.trim());
    return (
      <TouchableOpacity
        style={styles.storyCard}
        activeOpacity={0.9}
        onPress={() => handleOpenPost(item)}
      >
        <Image
          source={{
            uri:
              item.thumbnail_url ||
              'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80'
          }}
          style={styles.storyCover}
        />

        <View style={styles.storyBody}>
          <View style={styles.tagsRow}>
            {tags.map((tg, i) => (
              <View key={i} style={styles.tagPill}>
                <Text style={styles.tagPillText}>#{tg}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.storyTitle}>{item.title}</Text>
          <Text style={styles.storySummary} numberOfLines={2}>
            {item.summary}
          </Text>

          <View style={styles.authorFooter}>
            <View style={styles.authorRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(item.author_name || 'T')[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>{item.author_name}</Text>
                <Text style={styles.tripBadgeText}>{item.trip_badge || 'Du khách xác thực'}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statBtn}
                onPress={() => handleLikePost(item)}
              >
                <Ionicons name="heart" size={16} color="#F43F5E" />
                <Text style={styles.statText}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              <View style={styles.statBtn}>
                <Ionicons name="chatbubble-outline" size={15} color="#64748B" />
                <Text style={styles.statText}>{item.comments_count || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderStoryCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.headerBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerKicker}>TRAVEL COMMUNITY & UGC</Text>
                <Text style={styles.headerTitle}>Nhật Ký Hành Trình</Text>
                <Text style={styles.headerDesc}>
                  Cảm hứng thực tế, mẹo du lịch hữu ích & đặt chuyến đi tương tự chỉ với 1 chạm
                </Text>
              </View>
              <TouchableOpacity
                style={styles.writePostBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.writePostBtnText}>Viết bài</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagScroll}
            >
              {LOCATION_TAGS.map((tg) => {
                const active = selectedTag === tg;
                return (
                  <TouchableOpacity
                    key={tg}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedTag(tg)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {tg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
      />

      {/* MODAL 1: ĐỌC CÂU CHUYỆN, ĐẶT TOUR TƯƠNG TỰ & BÌNH LUẬN */}
      <Modal
        visible={!!activePost}
        animationType="slide"
        transparent
        onRequestClose={() => setActivePost(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {activePost && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Câu Chuyện Hành Trình</Text>
                  <TouchableOpacity onPress={() => setActivePost(null)}>
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Image
                    source={{ uri: activePost.thumbnail_url }}
                    style={styles.readerCover}
                  />
                  <View style={styles.readerBody}>
                    <Text style={styles.readerTitle}>{activePost.title}</Text>
                    <Text style={styles.readerAuthor}>
                      Bởi {activePost.author_name} • {activePost.trip_badge}
                    </Text>
                    <Text style={styles.readerContent}>{activePost.content}</Text>

                    {activePost.travel_tips ? (
                      <View style={styles.tipsBox}>
                        <Text style={styles.tipsHeading}>💡 Mẹo du lịch hữu ích:</Text>
                        <Text style={styles.tipsText}>{activePost.travel_tips}</Text>
                      </View>
                    ) : null}

                    {/* Thẻ liên kết Tour thực tế */}
                    <View style={styles.conversionCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.conversionKicker}>CHUYẾN ĐI ĐƯỢC NHẮC ĐẾN</Text>
                        <Text style={styles.conversionTitle}>
                          {activePost.tour_title || 'Du Thuyền 5 Sao Vịnh Hạ Long 2N1Đ'}
                        </Text>
                        <Text style={styles.conversionPrice}>
                          {formatPrice(activePost.adult_price || 3450000)} / khách
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.bookSimilarBtn}
                        onPress={() => {
                          const targetTourId = activePost.tour_id;
                          setActivePost(null);
                          onJumpToTour && onJumpToTour(targetTourId);
                        }}
                      >
                        <Text style={styles.bookSimilarText}>{t('bookSimilar')}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Khu vực Bình luận */}
                    <Text style={styles.commentSectionTitle}>
                      💬 Bình luận cộng đồng ({comments.length})
                    </Text>
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Chia sẻ cảm nghĩ hoặc hỏi kinh nghiệm..."
                        value={commentText}
                        onChangeText={setCommentText}
                      />
                      <TouchableOpacity
                        style={styles.sendCommentBtn}
                        onPress={handleSendComment}
                      >
                        <Ionicons name="send" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    {comments.map((cm, idx) => (
                      <View key={cm.id || idx} style={styles.commentItem}>
                        <Text style={styles.commentAuthor}>{cm.author_name}</Text>
                        <Text style={styles.commentBody}>{cm.content}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ĐĂNG BÀI VIẾT CỘNG ĐỒNG MỚI */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Đăng Nhật Ký Hành Trình Mới</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 18 }}>
              <Text style={styles.label}>Tiêu đề bài viết</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Trải nghiệm săn mây Sapa 3N2Đ đáng nhớ..."
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>Tóm tắt ngắn</Text>
              <TextInput
                style={styles.input}
                placeholder="Tóm tắt điểm thú vị nhất của chuyến đi..."
                value={newSummary}
                onChangeText={setNewSummary}
              />

              <Text style={styles.label}>Nội dung câu chuyện</Text>
              <TextInput
                style={[styles.input, { height: 95, textAlignVertical: 'top', paddingTop: 10 }]}
                multiline
                placeholder="Kể lại chi tiết lịch trình, ẩm thực, cảnh đẹp..."
                value={newContent}
                onChangeText={setNewContent}
              />

              <Text style={styles.label}>Mẹo du lịch (Travel Tips)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Nên chuẩn bị áo ấm và đặt vé cáp treo sớm..."
                value={newTips}
                onChangeText={setNewTips}
              />

              <Text style={styles.label}>Thẻ địa điểm (Cách nhau bằng dấu phẩy)</Text>
              <TextInput
                style={styles.input}
                value={newTags}
                onChangeText={setNewTags}
              />

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreatePost}
              >
                <Text style={styles.publishBtnText}>Xuất Bản Lên Cộng Đồng</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  listContent: { padding: 16, paddingBottom: 32 },
  headerBanner: {
    backgroundColor: '#0A192F',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14
  },
  headerKicker: {
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2
  },
  headerDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17
  },
  writePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12
  },
  writePostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  tagScroll: {
    paddingBottom: 14,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488'
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  storyCover: {
    width: '100%',
    height: 175
  },
  storyBody: {
    padding: 15
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  tagPill: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999
  },
  tagPillText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800'
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
    lineHeight: 22,
    marginBottom: 6
  },
  storySummary: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12
  },
  authorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  authorName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A'
  },
  tripBadgeText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F'
  },
  modalScroll: {
    maxHeight: 580
  },
  readerCover: {
    width: '100%',
    height: 190
  },
  readerBody: {
    padding: 18
  },
  readerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 6
  },
  readerAuthor: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '700',
    marginBottom: 12
  },
  readerContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 14
  },
  tipsBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14
  },
  tipsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4
  },
  tipsText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19
  },
  conversionCard: {
    backgroundColor: '#0A192F',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18
  },
  conversionKicker: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800'
  },
  conversionTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    marginVertical: 2
  },
  conversionPrice: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '900'
  },
  bookSimilarBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10
  },
  bookSimilarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  commentSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 10
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#F8FAFC'
  },
  sendCommentBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  commentAuthor: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  commentBody: {
    fontSize: 13,
    color: '#334155'
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    backgroundColor: '#F8FAFC'
  },
  publishBtn: {
    marginTop: 18,
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});

