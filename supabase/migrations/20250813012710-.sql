-- Create backup table for Question of the Day items
CREATE TABLE IF NOT EXISTS public.qotd_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and allow public read access
ALTER TABLE public.qotd_backup ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read qotd backup" ON public.qotd_backup;
CREATE POLICY "Public can read qotd backup"
ON public.qotd_backup
FOR SELECT
USING (true);

-- Seed with 25 items
INSERT INTO public.qotd_backup (item)
VALUES
  (jsonb_build_object(
    'question', 'When you disappoint someone you care about, what’s your first move—explain, apologize, or act—and what taught you that order?',
    'angle', 'Surfaces accountability style under pressure and whether repair is prioritized over defensiveness.',
    'tags', jsonb_build_array('conflict','integrity','healing'),
    'follow_ups', jsonb_build_array('What would the receipt look like?'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'What belief you were raised with did you retire on purpose, and what did it change about how you love?',
    'angle', 'Reveals self-authorship and capacity to update inherited scripts in relationships.',
    'tags', jsonb_build_array('values','healing','faith'),
    'follow_ups', jsonb_build_array('Who keeps you accountable?'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'If your partner needed a boundary that inconvenienced your routine, which habit would be easiest to change—and which would be your hill to die on?',
    'angle', 'Shows flexibility vs. rigidity and where non‑negotiables truly live.',
    'tags', jsonb_build_array('boundaries','values'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'When you’re angry, what do you do that you’re proud of—and what still needs a plan?',
    'angle', 'Uncovers conflict regulation skills and growth edges without shaming.',
    'tags', jsonb_build_array('conflict','healing'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'Tell me about a season you were tempted—money, attention, or ego—and the rule you used to keep yourself honest.',
    'angle', 'Tests integrity under pressure and presence of internal guardrails.',
    'tags', jsonb_build_array('integrity','trust','finances'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'What’s a promise you didn’t keep in a past relationship, and how would the better version of you keep it now?',
    'angle', 'Explores accountability and learning from rupture to repair.',
    'tags', jsonb_build_array('healing','integrity','trust'),
    'depth_score', 5
  )),
  (jsonb_build_object(
    'question', 'Whose opinion can actually talk you off a ledge—and how did they earn that access?',
    'angle', 'Reveals counsel network and humility toward feedback.',
    'tags', jsonb_build_array('values','trust'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'In conflict, do you prefer cooling off or closing loops the same day—and what evidence makes you switch strategies?',
    'angle', 'Shows conflict pacing, repair timeline, and adaptability.',
    'tags', jsonb_build_array('conflict','emotional-intelligence'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'What’s your definition of loyalty that has nothing to do with exclusivity?',
    'angle', 'Clarifies character, advocacy, and consistency beyond labels.',
    'tags', jsonb_build_array('values','trust'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'Describe the last time you changed your mind after new information—what helped you update instead of dig in?',
    'angle', 'Assesses intellectual honesty and flexibility.',
    'tags', jsonb_build_array('values','integrity'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'Which part of your life is over‑engineered, and which part needs more structure to be partner‑ready?',
    'angle', 'Balances competence with areas needing order before long‑term.',
    'tags', jsonb_build_array('ambition','values'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'If your future son copied your current treatment of women, what would you keep and what would you correct—specifically?',
    'angle', 'Invokes generational accountability and practical standards.',
    'tags', jsonb_build_array('values','integrity','family'),
    'depth_score', 5
  )),
  (jsonb_build_object(
    'question', 'What do you want your partner to never have to remind you to do?',
    'angle', 'Surfaces proactive care habits and reliability.',
    'tags', jsonb_build_array('values','intimacy'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'When did you realize you were the problem, and what did accountability look like in the weeks after?',
    'angle', 'Tests ownership and the muscle to repair with action.',
    'tags', jsonb_build_array('integrity','healing'),
    'depth_score', 5
  )),
  (jsonb_build_object(
    'question', 'What should a partner protect you from—even when you can’t see it in the moment?',
    'angle', 'Clarifies needs, blind spots, and co‑protection philosophy.',
    'tags', jsonb_build_array('intimacy','trust'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'How do you refill your energy without withdrawing from the relationship?',
    'angle', 'Explores autonomy vs. connection and healthy rhythms.',
    'tags', jsonb_build_array('intimacy','boundaries'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'A past partner thinks you were emotionally unavailable. If she’s 60% right, what’s the 60%?',
    'angle', 'Invites honest self‑assessment without self‑attack.',
    'tags', jsonb_build_array('healing','intimacy'),
    'depth_score', 5
  )),
  (jsonb_build_object(
    'question', 'What’s your algorithm for deciding if someone is safe to love—signals you weigh most and why?',
    'angle', 'Reveals attachment screening and discernment criteria.',
    'tags', jsonb_build_array('trust','boundaries'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'What’s a tradition from your family you’ll pass on, and one you’ll retire—and how would you explain both choices to your kids?',
    'angle', 'Surfaces values continuity vs. revision and parenting vision.',
    'tags', jsonb_build_array('family','values','faith'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'Describe a quiet way you show devotion that a casual dater would miss.',
    'angle', 'Detects subtle care behaviors and depth of investment.',
    'tags', jsonb_build_array('intimacy','values'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'If I asked your ex for one fair critique of you, what would she say—and how would you prove it’s different now?',
    'angle', 'Checks for fair‑mindedness and evidence‑based growth.',
    'tags', jsonb_build_array('integrity','healing'),
    'depth_score', 5
  )),
  (jsonb_build_object(
    'question', 'What’s your line between privacy and secrecy—and how would I know I’m on the right side of it?',
    'angle', 'Clarifies transparency norms and trust signals.',
    'tags', jsonb_build_array('trust','boundaries'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'When money and time collide, which one do you protect first—and how would that play out in our calendar?',
    'angle', 'Shows real‑world prioritization and resource philosophy.',
    'tags', jsonb_build_array('finances','ambition','values'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'What would make you proud of us during a hard year, not a good one?',
    'angle', 'Centers resilience markers and team habits under stress.',
    'tags', jsonb_build_array('intimacy','values','conflict'),
    'depth_score', 4
  )),
  (jsonb_build_object(
    'question', 'What boundary you hold today would protect our future most if life got messy?',
    'angle', 'Targets durable boundary-setting tied to long-term stability.',
    'tags', jsonb_build_array('boundaries','trust','values'),
    'depth_score', 4
  ));