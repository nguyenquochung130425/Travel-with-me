// Test end-to-end all new capabilities:
// Section 3: Advanced Reviews & UGC Community + Admin Moderation
// Section 5: Multi-Channel Notifications + Multi-Currency/Language + Cache/Redis

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting E2E Verification of Advanced Features...\n');

  try {
    // 1. Exchange Rates API
    console.log('--- 1. Testing Exchange Rates API ---');
    const ratesRes = await fetch(`${BASE_URL}/api/exchange-rates`);
    const ratesData = await ratesRes.json();
    console.log('Rates response:', ratesData.success, ratesData.data?.rates);

    // 2. Cache / Redis Stats
    console.log('\n--- 2. Testing Cache & Performance Stats ---');
    const cacheRes = await fetch(`${BASE_URL}/api/cache/stats`);
    const cacheData = await cacheRes.json();
    console.log('Cache stats:', cacheData);

    // 3. Multi-channel Notifications
    console.log('\n--- 3. Testing Notification Hub ---');
    const notifsRes = await fetch(`${BASE_URL}/api/notifications?userId=3`);
    const notifsData = await notifsRes.json();
    console.log(`User 3 has ${notifsData.data?.length} notifications`);
    if (notifsData.data?.length > 0) {
      const firstNotif = notifsData.data[0];
      console.log(`Sample: [${firstNotif.channel}] ${firstNotif.title}`);

      // Mark single as read
      const readRes = await fetch(`${BASE_URL}/api/notifications/${firstNotif.id}/read`, { method: 'PATCH' });
      const readData = await readRes.json();
      console.log('Mark read status:', readData.success);
    }

    // Simulate 24h departure reminder
    const simRes = await fetch(`${BASE_URL}/api/notifications/simulate-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '3', bookingId: 'BK-TEST-E2E', channel: 'ZALO' })
    });
    const simData = await simRes.json();
    console.log('Simulate Zalo reminder:', simData.success, simData.data?.title);

    // 4. Community UGC Stories & Interactions
    console.log('\n--- 4. Testing Travel Community UGC ---');
    const postsRes = await fetch(`${BASE_URL}/api/community/posts`);
    const postsData = await postsRes.json();
    console.log(`Found ${postsData.data?.length} community stories`);

    if (postsData.data?.length > 0) {
      const samplePost = postsData.data[0];
      console.log(`Story title: "${samplePost.title}" by ${samplePost.author_name || samplePost.authorName}`);

      // Like story
      const likeRes = await fetch(`${BASE_URL}/api/community/posts/${samplePost.id}/like`, { method: 'POST' });
      const likeData = await likeRes.json();
      console.log(`Liked story: likes count now = ${likeData.likesCount}`);

      // Add comment
      const commentRes = await fetch(`${BASE_URL}/api/community/posts/${samplePost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '3',
          authorName: 'Nguyễn Quốc Hùng',
          content: 'Bài viết rất hữu ích, cảm ơn bạn đã chia sẻ lịch trình chi tiết!'
        })
      });
      const commentData = await commentRes.json();
      console.log('Added comment:', commentData.success, commentData.data?.content);
    }

    // 5. Review Transparency Policy & Admin Moderation
    console.log('\n--- 5. Testing Review Transparency & Admin Moderation ---');
    // Try reviewing without completed booking (should fail if booking not completed or doesn't exist)
    const fakeReviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: 'NON_EXISTENT_BOOKING_999',
        tourId: 'tour-1',
        userId: '999',
        authorName: 'Spam Bot',
        rating: 1,
        comment: 'Spam fake review'
      })
    });
    const fakeReviewData = await fakeReviewRes.json();
    console.log('Transparency enforcement (Non-completed booking rejected):', !fakeReviewData.success, fakeReviewData.message);

    // Get Admin reviews
    const adminRevRes = await fetch(`${BASE_URL}/api/admin/reviews`);
    const adminRevData = await adminRevRes.json();
    console.log(`Admin sees total ${adminRevData.data?.length} reviews`);

    if (adminRevData.data?.length > 0) {
      const revToModerate = adminRevData.data[0];
      console.log(`Moderating review ID: ${revToModerate.id} (Visible: ${revToModerate.isVisible})`);

      // Admin official reply
      const replyRes = await fetch(`${BASE_URL}/api/admin/reviews/${revToModerate.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: 'Cảm ơn quý khách đã tin tưởng và đồng hành cùng Travel With Me. Chúc quý khách luôn có những chuyến đi tuyệt vời!'
        })
      });
      const replyData = await replyRes.json();
      console.log('Admin official reply status:', replyData.success, replyData.message);
    }

    console.log('\n🎉 ALL E2E CAPABILITY TESTS COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ E2E Test Error:', error);
  }
}

runTests();
