/* =========================================================
   MOCK DATA LAYER
   Plain records only. Pages never import this directly —
   they call services. Timestamps are ms since epoch, built
   relative to "now" so "2h ago" always reads sensibly.
   Replace services with Supabase calls and this file goes away.
========================================================= */
const _now = Date.now();
const ago = (hours) => _now - hours * 3600 * 1000;

const MOCK = {

  currentUserId: 'm1',

  stats: { newMembersThisMonth: 12 },

  profile: {
    id: 'OUG-24-000567', name: 'Elijah Ahmed', firstName: 'Elijah', middleName: '', lastName: 'Ahmed',
    branch: 'Ogugu Central Branch', branchId: 'b1',
    status: 'Active', memberSince: '2024',
    email: 'elijah.ahmed@example.com', phone: '+234 803 555 0182',
    occupation: 'Software Engineer', company: 'TechPulse Ltd', gender: 'Male', dob: '1992-05-14',
    maritalStatus: 'Married', spouseName: 'Amina Ahmed',
    location: 'Ikeja', state: 'Lagos', country: 'Nigeria',
    privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' }
  },

  /* Organisation "author" for official posts (not listed as a member) */
  org: { id: 'org', name: 'Ogugu United Forum', branch: 'Official Announcement', photo: 'assets/logo.jpeg', verified: true },

  members: [
    { id: 'm1', name: 'Elijah Ahmed', firstName: 'Elijah', middleName: '', lastName: 'Ahmed', branch: 'Ogugu Central Branch', branchId: 'b1', status: 'Active', memberSince: '2024', membershipId: 'OUG-24-000567', photo: 'assets/profile-1.jpeg', online: true, occupation: 'Software Engineer', company: 'TechPulse Ltd', gender: 'Male', dob: '1992-05-14', maritalStatus: 'Married', spouseName: 'Amina Ahmed', location: 'Ikeja', state: 'Lagos', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm2', name: 'Mary Uche', firstName: 'Mary', middleName: 'N.', lastName: 'Uche', branch: 'Ogun State Branch', branchId: 'b2', status: 'Active', memberSince: '2022', membershipId: 'OUG-22-000214', photo: 'assets/profile-2.jpeg', online: true, birthdayToday: true, phone: '+234 802 333 4455', email: 'mary.uche@example.com', occupation: 'Teacher & Educator', company: 'Grace Academy', gender: 'Female', dob: '1990-09-29', maritalStatus: 'Single', spouseName: '', location: 'Abeokuta', state: 'Ogun', country: 'Nigeria', privacy: { phone: 'public', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm3', name: 'David James', firstName: 'David', middleName: 'O.', lastName: 'James', branch: 'Lagos Branch', branchId: 'b3', status: 'Active', memberSince: '2021', membershipId: 'OUG-21-000098', photo: 'assets/profile-3.jpeg', online: true, birthdayToday: true, occupation: 'Architect', company: 'Urban Design Co.', gender: 'Male', dob: '1988-09-29', maritalStatus: 'Married', spouseName: 'Sarah James', location: 'Victoria Island', state: 'Lagos', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm4', name: 'Grace Okafor', firstName: 'Grace', middleName: 'C.', lastName: 'Okafor', branch: 'Ogugu Central Branch', branchId: 'b1', status: 'Active', memberSince: '2023', membershipId: 'OUG-23-000341', photo: 'assets/profile-4.jpeg', online: false, occupation: 'Accountant', company: 'Prime Financial', gender: 'Female', dob: '1995-11-20', maritalStatus: 'Single', spouseName: '', location: 'Yaba', state: 'Lagos', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm5', name: 'Samuel Bello', firstName: 'Samuel', middleName: 'A.', lastName: 'Bello', branch: 'Abuja Branch', branchId: 'b4', status: 'Active', memberSince: '2026', membershipId: 'OUG-26-000702', photo: 'assets/profile-5.jpeg', online: false, newMember: true, occupation: 'Civil Servant', company: 'Federal Ministry', gender: 'Male', dob: '1989-03-12', maritalStatus: 'Married', spouseName: 'Blessing Bello', location: 'Garki', state: 'Abuja (FCT)', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm6', name: 'Chidinma Eze', firstName: 'Chidinma', middleName: 'E.', lastName: 'Eze', branch: 'Lagos Branch', branchId: 'b3', status: 'Active', memberSince: '2020', membershipId: 'OUG-20-000037', photo: 'assets/profile-6.jpeg', online: false, occupation: 'Pharmacist', company: 'MedCare Pharmacy', gender: 'Female', dob: '1991-07-08', maritalStatus: 'Widowed', spouseName: '', location: 'Surulere', state: 'Lagos', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm7', name: 'Tunde Alabi', firstName: 'Tunde', middleName: 'B.', lastName: 'Alabi', branch: 'Ogun State Branch', branchId: 'b2', status: 'Active', memberSince: '2026', membershipId: 'OUG-26-000698', photo: 'assets/profile-7.jpeg', online: false, newMember: true, occupation: 'Entrepreneur', company: 'Alabi Logistics', gender: 'Male', dob: '1987-12-04', maritalStatus: 'Married', spouseName: 'Funke Alabi', location: 'Ibara', state: 'Ogun', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm8', name: 'John Okoro', firstName: 'John', middleName: 'K.', lastName: 'Okoro', branch: 'Abuja Branch', branchId: 'b4', status: 'Active', memberSince: '2026', membershipId: 'OUG-26-000711', photo: 'assets/profile-8.jpeg', online: true, newMember: true, occupation: 'Legal Practitioner', company: 'Okoro & Partners', gender: 'Male', dob: '1993-02-18', maritalStatus: 'Single', spouseName: '', location: 'Maitama', state: 'Abuja (FCT)', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } },
    { id: 'm9', name: 'Ngozi Nwosu', firstName: 'Ngozi', middleName: 'F.', lastName: 'Nwosu', branch: 'Lagos Branch', branchId: 'b3', status: 'Pending', memberSince: '2026', membershipId: 'OUG-26-000715', photo: 'assets/profile-9.jpeg', online: false, newMember: true, occupation: 'Human Resource Manager', company: 'Apex Global', gender: 'Female', dob: '1994-06-25', maritalStatus: 'Divorced', spouseName: '', location: 'Lekki', state: 'Lagos', country: 'Nigeria', privacy: { phone: 'private', email: 'private', occupation: 'members', maritalStatus: 'members', location: 'members' } }
  ],

  branches: [
    {
      id: 'b1',
      name: 'Ogugu Central Branch',
      location: 'Lagos',
      members: 248,
      description: 'The foundational headquarters branch of Ogugu United Forum bringing together central leadership and members.',
      image: 'assets/event-1.jpeg',
      meeting: {
        day: 'Sunday',
        frequency: 'Every 1st Sunday of the Month',
        time: '3:00 PM',
        venue: 'Ogugu Central Hall',
        address: '15 Community Avenue, Ogugu Central',
        city: 'Lagos',
        state: 'Lagos',
        additionalInfo: 'General meeting followed by executive updates.'
      }
    },
    {
      id: 'b2',
      name: 'Ogun State Branch',
      location: 'Abeokuta',
      members: 176,
      description: 'Active branch serving all members across Abeokuta, Sagamu, and Ogun State environs.',
      image: 'assets/post-1.jpeg',
      meeting: {
        day: 'Sunday',
        frequency: 'Every 2nd Sunday of the Month',
        time: '4:00 PM',
        venue: 'Royal Civic Center',
        address: '42 Ibara Housing Estate',
        city: 'Abeokuta',
        state: 'Ogun State',
        additionalInfo: 'Monthly fellowship and welfare support review.'
      }
    },
    {
      id: 'b3',
      name: 'Lagos Branch',
      location: 'Lagos',
      members: 312,
      description: 'Vibrant community branch uniting members across Lagos Mainland and Island.',
      image: 'assets/gallery-1.jpeg',
      meeting: {
        day: 'Sunday',
        frequency: 'Every 3rd Sunday of the Month',
        time: '4:00 PM',
        venue: 'Lagos Community Center',
        address: '12 Commercial Avenue, Sabo, Yaba',
        city: 'Lagos',
        state: 'Lagos State',
        additionalInfo: 'Networking, business directory showcase, and monthly dues collection.'
      }
    },
    {
      id: 'b4',
      name: 'Abuja Branch',
      location: 'Abuja',
      members: 94,
      description: 'Federal Capital Territory branch fostering unity, development, and member networking in Abuja.',
      image: 'assets/post-2.jpeg',
      meeting: {
        day: 'Saturday',
        frequency: 'Every 1st Saturday of the Month',
        time: '2:00 PM',
        venue: 'FCT Youth Development Hall',
        address: '88 Ahmadu Bello Way, Garki Area 11',
        city: 'Abuja',
        state: 'FCT',
        additionalInfo: 'Includes monthly business presentation & guest speaker session.'
      }
    },
    {
      id: 'b5',
      name: 'Port Harcourt Branch',
      location: 'Port Harcourt',
      members: 82,
      description: 'South-South branch promoting camaraderie, economic empowerment, and community welfare.',
      image: 'assets/post-3.jpeg',
      meeting: {
        day: 'Sunday',
        frequency: 'Every 2nd Sunday of the Month',
        time: '4:30 PM',
        venue: 'Garden City Event Center',
        address: '25 Aba Road, Garrison',
        city: 'Port Harcourt',
        state: 'Rivers State',
        additionalInfo: 'Monthly welfare check-ins and member welfare funding.'
      }
    }
  ],

  events: [
    { id: 'e1', status: 'upcoming', title: 'National Convention 2026', dateLabel: '28 Sep – 2 Oct, 2026', day: '28', month: 'SEP',
      time: '9:00 AM', location: 'Abeokuta, Ogun State', organizer: 'National Secretariat', image: 'assets/event-1.jpeg', registered: false, interested: 128,
      headline: 'Annual Convention registration is now open',
      summary: 'Join members from across our branches at the 2026 convention.',
      description: 'Join members from across our branches for five days of worship, workshops and fellowship at the 2026 National Convention.' },
    { id: 'e2', status: 'upcoming', title: 'Lagos Branch Fellowship Night', dateLabel: '17 Oct, 2026', day: '17', month: 'OCT',
      time: '5:00 PM', location: 'Lagos Branch Hall', organizer: 'Lagos Branch Committee', image: 'assets/post-2.jpeg', registered: false, interested: 46,
      description: 'An evening of music, testimonies and fellowship for members of the Lagos branch and their families.' },
    { id: 'e3', status: 'past', title: 'Branch Leaders Summit 2025', dateLabel: '14 Nov, 2025', day: '14', month: 'NOV',
      time: '10:00 AM', location: 'Lagos, Lagos State', organizer: 'National Secretariat', image: 'assets/post-3.jpeg', registered: true, interested: 60,
      description: 'Branch leaders convened to review the year and set priorities for 2026.' }
  ],

  transactions: [
    { id: 't1', title: 'Membership Dues',      amount: -10000, status: 'paid',       date: '28 Aug 2026', type: 'Dues',    desc: 'Annual membership dues payment.' },
    { id: 't2', title: 'Wallet Top-up',        amount: 5000,   status: 'successful', date: '25 Aug 2026', type: 'Top-up',  desc: 'Wallet funded via card.' },
    { id: 't3', title: 'Event Registration',   amount: -2000,  status: 'paid',       date: '19 Aug 2026', type: 'Event',   desc: 'Registration fee for Lagos Branch Fellowship Night.' },
    { id: 't4', title: 'Welfare Contribution', amount: -1500,  status: 'paid',       date: '10 Aug 2026', type: 'Welfare', desc: 'Voluntary contribution to Medical Support Fund.' },
    { id: 't5', title: 'Wallet Top-up',        amount: 10000,  status: 'successful', date: '2 Aug 2026',  type: 'Top-up',  desc: 'Wallet funded via bank transfer.' }
  ],

  announcements: [
    { id: 'a1', title: 'National Convention registration is now open', category: 'Event', date: 'Today', unread: true, image: 'assets/logo.jpeg',
      content: 'Registration for the 2026 National Convention is now open to all active members. The convention runs from 28 September to 2 October in Abeokuta, Ogun State. Early registration is encouraged as capacity is limited.' },
    { id: 'a2', title: 'Annual dues review for 2027 membership year', category: 'Membership', date: '2 days ago', unread: true, image: null,
      content: 'The finance committee will review the annual dues structure ahead of the 2027 membership year. Members will be notified of any changes before the next billing cycle.' },
    { id: 'a3', title: 'New welfare fund application window open', category: 'Welfare', date: '5 days ago', unread: false, image: null,
      content: 'Members needing support from the Medical or Education Support Fund can now submit applications through the Welfare section under More.' }
  ],

  /* ---------- SOCIAL ---------- */
  /* audience: "branch" | "general" */
  posts: [
    { id: 'p1', authorId: 'org', category: 'announcement', official: true, createdAt: ago(1.5), likes: 56, audience: 'general', branchId: null, branchName: null,
      title: 'National Convention registration is now open',
      content: 'Members from every branch are invited to the 2026 National Convention in Abeokuta, 28 September – 2 October. Register from the Events tab.',
      images: ['assets/event-1.jpeg'] },
    { id: 'p3', authorId: 'm1', category: 'event', createdAt: ago(2), likes: 24, audience: 'branch', branchId: 'b1', branchName: 'Ogugu Central Branch',
      content: 'We are excited to announce that registration for the 2026 convention is now open. Who is travelling from Lagos Central?',
      images: ['assets/post-1.jpeg'] },
    { id: 'p2', authorId: 'm2', category: 'community', createdAt: ago(5), likes: 31, audience: 'branch', branchId: 'b2', branchName: 'Ogun State Branch',
      content: 'Grateful for everyone who came out to the Ogun State branch meeting this weekend. Great turnout!',
      images: ['assets/gallery-1.jpeg', 'assets/gallery-2.jpeg', 'assets/gallery-3.jpeg'] },
    { id: 'p4', authorId: 'org', category: 'news', official: true, createdAt: ago(26), likes: 42, audience: 'general', branchId: null, branchName: null,
      title: 'Youth wing launches new mentorship programme across branches',
      content: 'The mentorship programme pairs younger members with experienced professionals across the forum. Sign-ups are now open nationwide.',
      images: ['assets/news-2.jpeg'] },
    { id: 'p6', authorId: 'm4', category: 'community', createdAt: ago(30), likes: 67, audience: 'branch', branchId: 'b1', branchName: 'Ogugu Central Branch',
      content: 'Community outreach day was a success. Thank you to every member who volunteered!',
      images: ['assets/gallery-2.jpeg', 'assets/gallery-3.jpeg', 'assets/post-1.jpeg', 'assets/post-2.jpeg', 'assets/post-3.jpeg', 'assets/gallery-1.jpeg'] },
    { id: 'p7', authorId: 'org', category: 'news', official: true, createdAt: ago(50), likes: 35, audience: 'general', branchId: null, branchName: null,
      title: 'Community leaders meet to discuss new development initiatives',
      content: 'Branch leaders gathered this week to review ongoing development projects and plan for the year ahead, focused on member welfare and infrastructure.',
      images: ['assets/news-1.jpeg'] },
    { id: 'p5', authorId: 'm3', category: 'community', createdAt: ago(52), likes: 18, audience: 'branch', branchId: 'b3', branchName: 'Lagos Branch',
      content: 'Preparations for the Lagos fellowship night are going well. Come and bring a friend!',
      images: ['assets/post-2.jpeg', 'assets/post-3.jpeg'] },
    { id: 'p8', authorId: 'm5', category: 'event', createdAt: ago(75), likes: 9, audience: 'general', branchId: null, branchName: null,
      content: 'Who else has registered for the Lagos Branch Fellowship Night? Would love to carpool from Abuja.',
      images: [] }
  ],

  /* parentCommentId is null for top-level; replies are one level deep */
  comments: [
    { id: 'c1', postId: 'p3', authorId: 'm2', content: 'This is really exciting. Looking forward to it!', createdAt: ago(1.8), likes: 2, parentCommentId: null },
    { id: 'c2', postId: 'p3', authorId: 'm1', content: 'Definitely. See you there!', createdAt: ago(1.6), likes: 1, parentCommentId: 'c1' },
    { id: 'c3', postId: 'p3', authorId: 'm3', content: 'The Lagos branch is travelling together. Let us know if you want to join.', createdAt: ago(1.2), likes: 5, parentCommentId: null },
    { id: 'c4', postId: 'p1', authorId: 'm4', content: 'Registered already!', createdAt: ago(1), likes: 3, parentCommentId: null },
    { id: 'c5', postId: 'p1', authorId: 'm6', content: 'Can families attend the closing ceremony?', createdAt: ago(0.7), likes: 0, parentCommentId: null },
    { id: 'c6', postId: 'p2', authorId: 'm7', content: 'Wish I had been there. Next time!', createdAt: ago(3), likes: 1, parentCommentId: null }
  ],

  /* type: private | group | branch  (only private is used by the UI today) */
  conversations: [
    { id: 'cv1', type: 'private', participants: ['m1', 'm3'], pinned: true,  updatedAt: ago(0.4) },
    { id: 'cv2', type: 'private', participants: ['m1', 'm2'], pinned: false, updatedAt: ago(0.8) },
    { id: 'cv3', type: 'private', participants: ['m1', 'm4'], pinned: false, updatedAt: ago(27) },
    { id: 'cv4', type: 'branch',  participants: ['m1', 'm4', 'm2'], name: 'Ogugu Central Branch', pinned: false, updatedAt: ago(52) }
  ],

  /* status — outgoing: sending | sent | read   incoming: unread | read */
  messages: [
    { id: 'ms1', conversationId: 'cv1', senderId: 'm3', content: 'Hi Elijah, hope you are well.', createdAt: ago(0.6), status: 'unread' },
    { id: 'ms2', conversationId: 'cv1', senderId: 'm3', content: 'Are you free for the Lagos fellowship night planning call tomorrow?', createdAt: ago(0.4), status: 'unread' },
    { id: 'ms3', conversationId: 'cv2', senderId: 'm2', content: 'Hi Elijah!', createdAt: ago(2.4), status: 'read' },
    { id: 'ms4', conversationId: 'cv2', senderId: 'm1', content: 'Hello Mary, good to hear from you.', createdAt: ago(2.3), status: 'read' },
    { id: 'ms5', conversationId: 'cv2', senderId: 'm2', content: 'Are you attending the convention?', createdAt: ago(0.8), status: 'unread' },
    { id: 'ms6', conversationId: 'cv3', senderId: 'm1', content: 'Thanks for organising the outreach, Grace.', createdAt: ago(27.5), status: 'read' },
    { id: 'ms7', conversationId: 'cv3', senderId: 'm4', content: 'It was a pleasure. See you at the convention!', createdAt: ago(27), status: 'read' },
    { id: 'ms8', conversationId: 'cv4', senderId: 'm4', content: 'Reminder: branch meeting notes are in Documents.', createdAt: ago(53), status: 'read' },
    { id: 'ms9', conversationId: 'cv4', senderId: 'm2', content: 'Thanks Grace, will review tonight.', createdAt: ago(52), status: 'read' }
  ],

  /* link = router path opened when the notification is tapped */
  notifications: [
    { id: 'no1', type: 'comment',  text: 'Mary Uche commented on your post',              createdAt: ago(1.8), unread: true,  link: 'community/post/p3' },
    { id: 'no2', type: 'message',  text: 'You have a new message from David James',       createdAt: ago(0.4), unread: true,  link: 'chat/cv1' },
    { id: 'no3', type: 'like',     text: 'Samuel Bello and 23 others liked your post',    createdAt: ago(1.9), unread: true,  link: 'community/post/p3' },
    { id: 'no4', type: 'announcement', text: 'National Convention registration is now open', createdAt: ago(1.5), unread: true, link: 'community/post/p1' },
    { id: 'no5', type: 'event',    text: 'Reminder: Lagos Branch Fellowship Night is on 17 Oct', createdAt: ago(20), unread: false, link: 'events/e2' },
    { id: 'no6', type: 'birthday', text: 'Mary Uche has a birthday today',                createdAt: ago(6),  unread: false, link: 'community/members/m2' },
    { id: 'no7', type: 'payment',  text: 'Your membership dues payment was successful',   createdAt: ago(720), unread: false, link: 'payments' },
    { id: 'no8', type: 'welfare',  text: 'Your welfare request was received',             createdAt: ago(1200), unread: false, link: 'more/welfare' }
  ],

  gallery: [
    { id: 'g1', image: 'assets/gallery-1.jpeg', caption: 'National Convention 2025. opening ceremony' },
    { id: 'g2', image: 'assets/gallery-2.jpeg', caption: 'Lagos Branch fellowship night' },
    { id: 'g3', image: 'assets/gallery-3.jpeg', caption: 'Youth wing mentorship kickoff' },
    { id: 'g4', image: 'assets/post-1.jpeg',    caption: 'Ogun State branch meeting' },
    { id: 'g5', image: 'assets/post-2.jpeg',    caption: 'Community outreach day' },
    { id: 'g6', image: 'assets/post-3.jpeg',    caption: 'Branch leaders summit' }
  ],

  documents: [
    { id: 'd1', title: 'Constitution',       category: 'Community Governance', date: 'Jan 2024', type: 'PDF' },
    { id: 'd2', title: 'Annual Report',      category: '2025',                 date: 'Mar 2026', type: 'PDF' },
    { id: 'd3', title: 'Meeting Minutes',    category: 'September 2026',       date: 'Sep 2026', type: 'PDF' },
    { id: 'd4', title: 'Welfare Fund Policy', category: 'Welfare',             date: 'Jun 2025', type: 'PDF' }
  ],

  meetings: [
    { id: 'mt1', status: 'upcoming', title: 'Monthly General Meeting', dateLabel: 'Saturday, 3 October 2026', time: '10:00 AM', location: 'Community Hall', description: 'Regular monthly meeting covering branch updates, finance report and open floor.' },
    { id: 'mt2', status: 'upcoming', title: 'Welfare Committee Review', dateLabel: 'Tuesday, 13 October 2026', time: '6:00 PM', location: 'Virtual. Zoom', description: 'Committee review of pending welfare applications.' },
    { id: 'mt3', status: 'past', title: 'Q3 Finance Briefing', dateLabel: 'Saturday, 6 September 2026', time: '10:00 AM', location: 'Community Hall', description: 'Quarterly finance briefing for all members.' }
  ],

  welfare: [
    { id: 'w1', title: 'Medical Support Fund', desc: 'Emergency medical assistance for members and immediate family.', status: 'Active' },
    { id: 'w2', title: 'Community Emergency Support', desc: 'Rapid support for members facing sudden hardship.', status: 'Active' },
    { id: 'w3', title: 'Education Support', desc: "Support toward school fees for members' children.", status: 'Active' }
  ],
  myWelfareRequests: [ { id: 'wr1', program: 'Medical Support Fund', date: '2 Aug 2026', status: 'Under review' } ],

  polls: [
    { id: 'poll1', question: 'What should be the main focus of our next community project?',
      options: [ { id: 'o1', label: 'Education', votes: 42 }, { id: 'o2', label: 'Welfare', votes: 28 }, { id: 'o3', label: 'Infrastructure', votes: 20 }, { id: 'o4', label: 'Youth Development', votes: 10 } ] }
  ],

  tips: [ { id: 'tip1', title: 'Community Tip', category: 'Engagement', content: 'Strong communities grow when members participate, communicate and support one another.' } ],

  languageCorner: { phrase: 'Welcome', translation: 'Nnọọ', language: 'Igbo', meaning: 'A warm greeting extended to members and visitors alike.' }
};
