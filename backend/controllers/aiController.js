import { fallbackCampaigns } from '../utils/storeUtils.js';

export const aiController = {
  generate(req, res) {
    try {
      const { action, title, category, stage, university } = req.body;

      if (action === 'pitch_bio' || action === 'slogan') {
        const taglines = [
          `Revolutionizing ${category || 'EdTech'} through smart university ecosystem integration.`,
          `Empowering student innovators at ${university || 'top Bangladeshi universities'} with seamless scalable tech.`,
          `Next-gen ${category || 'FinTech'} platform built by student entrepreneurs for rapid market traction.`,
          `Disrupting traditional workflows with automated milestone verification and community backing.`
        ];
        const slogan = taglines[Math.floor(Math.random() * taglines.length)];
        const bio = `${title || 'Our Venture'} is an innovative ${category || 'technology'} startup developed by founders at ${university || 'BRAC University'}. Currently in ${stage || 'MVP Stage'}, our platform addresses key operational challenges for university communities in Bangladesh by introducing digital automation, scalable infrastructure, and milestone-verified growth execution.`;

        return res.status(200).json({ slogan, bio });
      }

      if (action === 'business_summary') {
        const summary = `BUSINESS SUMMARY FOR ${title || 'VENTURE'}:\n1. Core Value Proposition: Streamlined ${category || 'Tech'} operations tailored for high-growth Bangladeshi markets.\n2. Milestone Execution: Clear 3-tranche roadmap focused on MVP deployment, customer acquisition, and recurring revenue.\n3. Investor Return Alignment: High alignment with alumni networks and revenue share / milestone debt models.`;
        return res.status(200).json({ summary });
      }

      if (action === 'investor_match') {
        const recommendations = fallbackCampaigns.slice(0, 3).map(c => ({
          id: c.id,
          title: c.title,
          category: c.category,
          matchScore: Math.floor(88 + Math.random() * 11) + '% Match',
          reason: `Strong alignment with your preference for ${c.category} ventures originating from ${c.university}.`
        }));
        return res.status(200).json({ recommendations });
      }

      res.status(200).json({
        slogan: `Transforming ${category || 'Education'} through verified student innovation.`,
        bio: `A high-impact startup leveraging technology to build sustainable value in Bangladesh.`
      });
    } catch (err) {
      res.status(500).json({ error: 'AI generation failed.' });
    }
  }
};
