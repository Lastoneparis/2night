# -*- coding: utf-8 -*-
"""
2NIGHT blog — English source of truth.

Every user-visible blog string lives here, keyed. The generator
(gen_blog_i18n.py) reads this + the per-locale translation files and
emits website/blog/blog-i18n.js (window.TN_BLOG_I18N). The HTML pages
reference the same keys via data-blog-i18n.

Keys are namespaced:
  bx_*  -> blog index page
  a1_*  -> article 1
  a2_*  -> article 2
  a3_*  -> article 3
  bc_*  -> shared blog chrome (read-next labels, etc.)

Some keys hold inline HTML (links, <strong>) and are flagged in HTML
with data-blog-html. Translations must preserve the tags/links.
"""

EN = {
    # ---- shared blog chrome ----
    "bc_blog": "Blog",
    "bc_read_next": "Read next",
    "bc_back_blog": "← Back to the blog",
    "bc_back_home": "← Back to home",
    "bc_min_read": "min read",
    "bc_by": "By the 2NIGHT team",
    "bc_cta_title": "Stop planning. Start tonight.",
    "bc_cta_sub": "2NIGHT shows you who's out near you, right now. Set your radius, match, and make a real plan — tonight, not tomorrow.",
    "bc_cta_button": "Download 2NIGHT",

    # ---- blog index ----
    "bx_meta_title": "2NIGHT Blog — Meeting people, going out & nightlife, tonight",
    "bx_meta_desc": "Practical guides on meeting people near you tonight, making spontaneous plans, going out solo, staying safe, and making friends in a new city — from the team behind 2NIGHT.",
    "bx_og_title": "2NIGHT Blog — Go out tonight, not someday",
    "bx_og_desc": "Guides on meeting people near you, spontaneous plans, nightlife safety and making friends in a new city.",
    "bx_kicker": "The 2NIGHT Blog",
    "bx_title": "Go out tonight, not someday.",
    "bx_lead": "Real, practical guides on meeting people near you, making plans that actually happen, going out solo, and staying safe while you do it. Written by the team building 2NIGHT.",

    # article cards (index)
    "bx_c1_tag": "Meeting people",
    "bx_c1_title": "How to Meet People Near You Tonight (Without Waiting for the Weekend)",
    "bx_c1_excerpt": "A step-by-step playbook for turning a free evening into real plans with real people who are out right now.",
    "bx_c2_tag": "Dating apps vs. discovery",
    "bx_c2_title": "Radius-Based Social Discovery vs. Traditional Dating Apps",
    "bx_c2_excerpt": "Why “who's out near me tonight” beats endless swiping toward “maybe next week” — and when each approach actually works.",
    "bx_c3_tag": "New city · Safety",
    "bx_c3_title": "Making Friends in a New City: A Guide to Going Out Solo (and Staying Safe)",
    "bx_c3_excerpt": "Just moved somewhere new? Here's how to build a real social circle from zero — plus a practical safety checklist for meeting new people.",
    "bx_card_more": "Read the guide",

    # =====================================================================
    #  ARTICLE 1 — Meet people near you tonight
    # =====================================================================
    "a1_meta_title": "How to Meet People Near You Tonight — A Practical Guide | 2NIGHT",
    "a1_meta_desc": "Want to meet people near you tonight? This practical guide shows how to turn a free evening into real plans — pick a vibe, set your radius, message well, and meet safely. Tonight, not tomorrow.",
    "a1_og_title": "How to Meet People Near You Tonight",
    "a1_og_desc": "A step-by-step playbook for turning a free evening into real plans with real people who are out right now.",
    "a1_tag": "Meeting people",
    "a1_read": "7 min read",
    "a1_h1": "How to Meet People Near You Tonight (Without Waiting for the Weekend)",
    "a1_lead": "It's 7pm. You're free, a little restless, and you don't want to spend another evening scrolling on the couch. The good news: meeting someone tonight is far more achievable than most people think — if you stop planning and start moving.",

    "a1_h2_1": "Why “tonight” is the easiest plan to make",
    "a1_p1": "Most social plans die in a group chat. Someone says “we should hang out soon,” three people heart-react, and nothing happens. The problem isn't a lack of desire — it's distance in time. The further out a plan is, the more likely life gets in the way.",
    "a1_p2": "Tonight has the opposite property. There's no calendar to negotiate, no “let me check my week,” no flaking three days later. The people who are free tonight are free right now, and that shared availability is the single most powerful ingredient in any plan. Your job is simply to find them.",

    "a1_h2_2": "Step 1 — Decide what kind of night you actually want",
    "a1_p3": "Before you open any app or text anyone, get specific about the vibe. “I want to go out” is too vague to act on. Pick a lane:",
    "a1_li1": "<strong>Low-key:</strong> a quiet drink, a coffee that runs late, a walk and a conversation.",
    "a1_li2": "<strong>Social:</strong> live music, a busy bar, a games night, something with energy around you.",
    "a1_li3": "<strong>Active:</strong> a late gym session, a run club, bouldering, a pickup game.",
    "a1_li4": "<strong>Cultural:</strong> a gallery late-night, a film, an open mic, a pop-up.",
    "a1_p4": "Naming the vibe does two things: it makes you easy to match with, and it filters out plans you'd quietly resent. Someone who wants a loud club and someone who wants a quiet wine bar are both “going out” — and both will have a worse night if they end up together.",

    "a1_h2_3": "Step 2 — Set your radius (closer than you think)",
    "a1_p5": "The biggest mistake people make is casting too wide a net. A match across town who'd take 45 minutes to reach is, realistically, not happening tonight. Proximity is everything when the clock is running.",
    "a1_p6": "This is exactly the problem radius-based social discovery solves. Instead of browsing everyone everywhere, you set a distance — your street, your neighbourhood, your city — and only see people inside it. On 2NIGHT you choose how far the night reaches: keep it tight at 5 km when you want somewhere walkable, or open it up to 15–50 km when you're happy to travel for the right plan.",
    "a1_fig1_cap": "The Tonight Feed on 2NIGHT — real people near you, free right now.",

    "a1_h2_4": "Step 3 — Lead with a plan, not a “hey”",
    "a1_p7": "Once you can see who's out, the difference between a dead conversation and a real plan is your opening message. “Hey” puts all the work on the other person and almost always stalls. A good opener does the opposite — it makes saying yes effortless.",
    "a1_quote": "Don't ask someone to design the evening. Offer them an easy yes.",
    "a1_p8": "Compare these two openers. “Hey, how's your night going?” versus “There's live music at the place on the corner around 9 — I'm heading over, want to come?” The second one names a place, a time, and a low-pressure invitation. It's specific, it's tonight, and it's easy to accept or counter.",
    "a1_li5": "Reference something real — their status, a shared interest, the same neighbourhood.",
    "a1_li6": "Suggest a concrete, public spot and a rough time.",
    "a1_li7": "Keep it light — “no worries if not” lowers the stakes for everyone.",

    "a1_h2_5": "Step 4 — Move fast, but meet smart",
    "a1_p9": "Momentum matters. The longer a “tonight” plan sits in a chat, the more likely it evaporates. Once you've agreed on something, lock the spot and the time and go. But moving fast doesn't mean abandoning common sense.",
    "a1_li8": "Meet in a public, busy place — a bar, a café, a venue — never a private home on a first meet.",
    "a1_li9": "Tell a friend where you're going and who you're meeting.",
    "a1_li10": "Keep your own transport home, and trust your gut — if something feels off, leave.",
    "a1_p10": "We go deeper on this in our guide to <a class=\"inline\" href=\"/blog/making-friends-new-city-nightlife-safety.html\">going out solo and staying safe</a>, which is worth a read before any first meet with someone new.",

    "a1_h2_6": "Step 5 — Let one good night build the next",
    "a1_p11": "Here's the part people miss: a single good night isn't the goal — it's the seed. The person you grabbed a drink with tonight knows other people, other places, other plans. Meeting someone in person, tonight, is how a social life actually compounds. Online intentions don't; real evenings do.",
    "a1_p12": "So the next time it's 7pm and you feel that restless pull, don't put it in a calendar for “soon.” Soon never comes. Decide what you want, see who's near you, send the message that makes yes easy — and go.",

    "a1_callout_h": "The short version",
    "a1_callout_p": "Pick a vibe, set a tight radius, open with a real plan instead of “hey,” meet somewhere public, and let one good night lead to the next. The whole thing can take fifteen minutes and change your entire evening.",

    # =====================================================================
    #  ARTICLE 2 — Radius-based discovery vs traditional dating apps
    # =====================================================================
    "a2_meta_title": "Radius-Based Social Discovery vs. Traditional Dating Apps | 2NIGHT",
    "a2_meta_desc": "Endless swiping vs. seeing who's out near you tonight: a clear comparison of radius-based social discovery and traditional dating apps — how each works, where each wins, and which fits the night you actually want.",
    "a2_og_title": "Radius-Based Social Discovery vs. Traditional Dating Apps",
    "a2_og_desc": "Why “who's out near me tonight” beats endless swiping toward “maybe next week.”",
    "a2_tag": "Dating apps vs. discovery",
    "a2_read": "8 min read",
    "a2_h1": "Radius-Based Social Discovery vs. Traditional Dating Apps: Why “Tonight” Beats “Someday”",
    "a2_lead": "Both promise to help you meet someone. But a traditional dating app and a radius-based discovery app are built around completely different ideas of time — and that single difference shapes everything about how they feel to use.",

    "a2_h2_1": "Two different models of meeting people",
    "a2_p1": "A traditional dating app is, at its core, a matchmaking queue. You build a profile, swipe through a deck of people who could be anywhere in a wide region, match, and then begin the slow work of a text conversation that might — eventually — become a date next week, or the week after.",
    "a2_p2": "Radius-based social discovery flips the order. Instead of “who might I be compatible with someday,” it answers “who is near me and free right now.” You set a distance, you see the people inside it who are out tonight, and the goal isn't a pen-pal — it's a plan in the next few hours. Same destination, opposite starting point.",

    "a2_h2_2": "Where traditional dating apps win",
    "a2_p3": "Let's be fair: the swipe model exists for good reasons, and for some goals it's genuinely the better tool.",
    "a2_li1": "<strong>Long-term intent:</strong> if you're looking for a serious relationship, the slower filtering of profiles, prompts and back-and-forth can help you find compatibility before you ever meet.",
    "a2_li2": "<strong>Selectivity:</strong> detailed profiles let you screen for values, lifestyle and dealbreakers up front.",
    "a2_li3": "<strong>Lower time pressure:</strong> you can match on Tuesday and meet in two weeks, which suits busy or far-apart schedules.",
    "a2_p4": "If your honest answer to “when do you want to meet?” is “sometime in the next month, with the right person,” a traditional app is a reasonable fit.",

    "a2_h2_3": "Where radius-based discovery wins",
    "a2_p5": "But a huge share of the time, that's not the actual question. The real one is: “I'm free tonight — who else is, and where are they?” That's where proximity-first discovery pulls ahead.",
    "a2_li4": "<strong>It respects your time:</strong> no months of texting toward a date that may never happen. You see who's out and you go.",
    "a2_li5": "<strong>Shared availability is built in:</strong> everyone you see is free in the same window you are — the hardest part of any plan, solved by default.",
    "a2_li6": "<strong>Distance is real, not abstract:</strong> a 5 km radius is a walkable plan; a match 50 km away you'll never meet isn't shown.",
    "a2_li7": "<strong>It's not only dating:</strong> spontaneous discovery works for new friends, a plus-one to an event, or simply company for the evening.",
    "a2_fig1_cap": "Set your radius on 2NIGHT — from your street to the whole city.",

    "a2_h2_4": "The “swipe fatigue” problem",
    "a2_p6": "There's a well-documented downside to the endless-deck model: it can start to feel like work. Hundreds of swipes, a handful of matches, most conversations fading after two messages. Psychologists call the underlying trap the paradox of choice — when options feel infinite, we commit to none of them and enjoy the process less.",
    "a2_quote": "When everyone is theoretically available someday, no one is actually available tonight.",
    "a2_p7": "Radius-based discovery sidesteps this by shrinking the field to something human-sized: not “everyone in a 100 km region, eventually,” but “these specific people, near me, out right now.” A smaller, time-bound set of options is far easier to act on — and acting is the entire point.",

    "a2_h2_5": "How 2NIGHT approaches it",
    "a2_p8": "2NIGHT is built around the tonight question. You set a one-line status — what you're up for this evening — and go live. You see the Tonight Feed of people near you who are also out, ping the ones you like, and match. From there it's a plan, not a pen-pal: a place, a time, and a real meet.",
    "a2_p9": "Your radius is yours to set. Keep it close at 5 km when you want somewhere walkable, open the whole city at 15 km, or go wide at 50 km when you're happy to travel for the right night. Your membership tier sets how far the night can reach — but the philosophy never changes: proximity first, tonight first.",

    "a2_h2_6": "So which should you use?",
    "a2_p10": "It's not really a war — it's a question of what you want this week. If you're patiently building toward a long-term relationship and don't mind a slow burn, a traditional dating app is a fine tool. If you're tired of conversations that go nowhere and you'd rather actually be out, in person, tonight, radius-based discovery is built for exactly that impulse.",
    "a2_p11": "The best nights rarely come from the most swiping. They come from deciding, at 7pm, that you'd like to meet someone — and then doing something about it. If that sounds like you, here's <a class=\"inline\" href=\"/blog/meet-people-near-you-tonight.html\">how to meet people near you tonight</a>, step by step.",

    "a2_callout_h": "In one line",
    "a2_callout_p": "Traditional dating apps optimise for “the right person, someday.” Radius-based discovery optimises for “real people, near me, tonight.” Pick the one that matches the night you actually want.",

    # =====================================================================
    #  ARTICLE 3 — Making friends in a new city + going out solo + safety
    # =====================================================================
    "a3_meta_title": "Making Friends in a New City: Going Out Solo & Staying Safe | 2NIGHT",
    "a3_meta_desc": "Just moved? Learn how to make friends in a new city from zero — going out solo with confidence, finding your people fast, and a practical nightlife safety checklist for meeting strangers.",
    "a3_og_title": "Making Friends in a New City: A Guide to Going Out Solo",
    "a3_og_desc": "Build a real social circle from zero — plus a practical safety checklist for meeting new people.",
    "a3_tag": "New city · Safety",
    "a3_read": "9 min read",
    "a3_h1": "Making Friends in a New City: A Guide to Going Out Solo (and Staying Safe)",
    "a3_lead": "Moving somewhere new is exciting for about a week. Then the boxes are unpacked, the novelty fades, and you realise you don't actually know anyone. Building a social circle from zero is one of the most underrated challenges of adult life — and one of the most doable, once you treat it as a skill rather than luck.",

    "a3_h2_1": "Why making friends as an adult feels hard",
    "a3_p1": "As kids we made friends by proximity and repetition — the same classmates, every day, for years. Adult life strips both away. People are scattered, schedules are full, and the easy “we just kept running into each other” path disappears. Nothing's wrong with you; the structure that used to do the work is simply gone.",
    "a3_p2": "Which means the fix is structural too. To make friends in a new city you need to manufacture the two ingredients childhood handed you for free: <strong>proximity</strong> (being physically near the same people) and <strong>repetition</strong> (seeing them more than once). Everything below is really about engineering those two things on purpose.",

    "a3_h2_2": "Go out solo — it's a feature, not a failure",
    "a3_p3": "Many people stay in simply because they have no one to go out with — and waiting for company is the single biggest reason newcomers stay isolated. But going out alone is quietly one of the best social tools you have. Without a friend to retreat into, you're far more approachable and far more likely to start a conversation.",
    "a3_p4": "Make solo outings easy on yourself:",
    "a3_li1": "<strong>Pick the bar, not the table:</strong> sitting at a bar or counter invites conversation in a way a corner table never will.",
    "a3_li2": "<strong>Go where there's a shared activity:</strong> a class, a run club, a games night, a tasting — a built-in reason to talk to strangers.",
    "a3_li3": "<strong>Become a regular:</strong> the same café or gym three times a week turns strangers into familiar faces, then into friends.",
    "a3_li4": "<strong>Give yourself an exit:</strong> “I'll stay 45 minutes” removes the pressure and almost always turns into longer.",
    "a3_fig1_cap": "Join a plan near you on 2NIGHT — instant proximity, no waiting for company.",

    "a3_h2_3": "Use proximity to your advantage",
    "a3_p5": "Here's where technology genuinely helps. The hardest part of a new city is that you don't yet know where your people are. Radius-based social discovery short-circuits that: instead of hoping to bump into the right crowd, you can see who's out near you tonight and what's happening close by.",
    "a3_p6": "This is exactly what 2NIGHT is built for. Land somewhere new, set your radius, and the local night is already in front of you — people who are out right now, plans you can join, company for the evening without needing a pre-existing circle. It turns “I don't know anyone here” into “let me see who's nearby tonight.”",

    "a3_h2_4": "Turn one meeting into a circle",
    "a3_p7": "A social circle isn't built one friend at a time in isolation — it grows through connection. The person you meet tonight knows other people, hosts other plans, frequents other places. Your job is to convert single encounters into repeat ones.",
    "a3_quote": "One genuine evening, followed up on, is worth more than fifty introductions you never see again.",
    "a3_li5": "Follow up within a day or two — a specific “that bar was great, let's do the Thursday quiz next week” beats a vague “we should hang out.”",
    "a3_li6": "Say yes to the invitation behind the invitation — the house party, the friend's birthday, the group hike.",
    "a3_li7": "Be the one who organises. People are grateful to whoever sends the “anyone free Friday?” message. Be that person.",

    "a3_h2_5": "The going-out-solo safety checklist",
    "a3_p8": "Meeting new people is wonderful; doing it sensibly is non-negotiable, especially in a city you don't know well yet. None of this should make you anxious — treat it as the same kind of automatic habit as locking your door.",
    "a3_li8": "<strong>Meet in public, busy places.</strong> A first meet is always a bar, café or venue — never a private home, never an isolated spot.",
    "a3_li9": "<strong>Tell someone your plan.</strong> Share where you're going, who you're meeting and a rough timeline with a friend back home or new.",
    "a3_li10": "<strong>Keep your own way home.</strong> Don't rely on someone you just met for your ride. Know your route and keep enough battery and cash.",
    "a3_li11": "<strong>Mind your drink and your pace.</strong> Watch it being poured, keep it with you, and stay clear-headed enough to make good calls.",
    "a3_li12": "<strong>Guard personal details early.</strong> Your exact address, workplace and routine can wait until trust is earned.",
    "a3_li13": "<strong>Trust your gut.</strong> If anything feels off, you owe no one an explanation. Leaving early is always a complete sentence.",
    "a3_p9": "Remember that apps help you meet people but don't vet them — 2NIGHT doesn't run background or identity checks, so your own judgement is the real safety system. You can block and report anyone in a tap, but the habits above matter most. See our full <a class=\"inline\" href=\"/safety\">Safety guidance</a> for more.",

    "a3_h2_6": "Give it time — and keep showing up",
    "a3_p10": "A real social circle in a new city usually takes a few months, not a few nights, and the people who build one fastest aren't the most charismatic — they're the ones who keep showing up. Every evening you go out is a small bet, and you only need a few to pay off. The first hello is the hardest; after that it compounds.",
    "a3_p11": "So unpack the last box, pick a night, and go meet your city. The people you're looking for are already out there tonight — you just have to be out there too. If you're not sure where to start, here's <a class=\"inline\" href=\"/blog/meet-people-near-you-tonight.html\">how to meet people near you tonight</a>.",

    "a3_callout_h": "The takeaway",
    "a3_callout_p": "Friendship in a new city is proximity plus repetition, engineered on purpose. Go out solo, use your radius to find who's near, follow up relentlessly, and keep your safety habits automatic. Show up enough times and the circle builds itself.",
}
