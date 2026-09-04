import http from 'http';
import app from './app.js';
import { initSocket } from './config/socket.js';
import { supabase, isSupabaseConfigured } from './config/supabase.js';
import { fallbackCampaigns } from './utils/storeUtils.js';

const server = http.createServer(app);

// Initialize Socket.io real-time connection
const io = initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FundBridge Backend Server running on port ${PORT}`);

  // S3: retire hollow Supabase CampusBites seed (৳450k, 0 milestones) when canonical campusbites_1 exists
  (async () => {
    try {
      if (!isSupabaseConfigured || !supabase) return;
      const hasCanonical = fallbackCampaigns.some((c) => (c.id || c._id) === 'campusbites_1');
      if (!hasCanonical) return;
      await supabase
        .from('campaigns')
        .update({ verified: false, status: 'archived' })
        .eq('id', 'campusbites');
    } catch (e) {
      console.warn('S3 CampusBites seed retire warning:', e.message);
    }
  })();
});

export default app;
