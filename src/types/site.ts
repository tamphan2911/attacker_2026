export type Locale = "en" | "vi";
export type Theme = "dark" | "light";
export type SubmissionRound = "round-2" | "round-3";
export type UserRole =
  | "student"
  | "supporter"
  | "judge"
  | "moderator"
  | "admin";
export type CompetitionStage = "round-1" | "round-2" | "round-3";
export type CompetitionState = "not-eligible" | CompetitionStage;
export type CompetitionRoundKey = CompetitionStage;
export type TeamRound1LockStatus = "open" | "pending" | "locked" | "declined";
export type TeamFinalOutcome =
  | "champion"
  | "runner-up"
  | "third-place"
  | "fourth-place"
  | "emerging-team";

export type Round2AdvancementBracket = "finalist" | "emerging";

export type LocalizedText = Record<Locale, string>;

export interface NavItem {
  href: string;
  label: LocalizedText;
}

export interface MetricItem {
  value: string;
  label: LocalizedText;
  note: LocalizedText;
}

export interface SpotlightItem {
  title: LocalizedText;
  description: LocalizedText;
  accent: string;
}

export interface RoundItem {
  id: string;
  label: LocalizedText;
  title: LocalizedText;
  duration: LocalizedText;
  description: LocalizedText;
  deliverables: LocalizedText[];
}

export interface RewardItem {
  title: LocalizedText;
  amount: LocalizedText;
  note: LocalizedText;
}

export interface RuleItem {
  title: LocalizedText;
  description: LocalizedText;
}

export interface TimelineItem {
  id: string;
  phase: "general" | CompetitionRoundKey;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  title: LocalizedText;
  description: LocalizedText;
  location: LocalizedText;
  method: LocalizedText;
  supportLinks?: NavItem[];
}

export interface CompetitionRoundWindow {
  round: CompetitionRoundKey;
  title: LocalizedText;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

export interface FAQItem {
  topicId: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface FAQTopic {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface SponsorProfile {
  name: string;
  logoSrc: string;
  hidden?: boolean;
  tier: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
  contribution: LocalizedText;
}

export interface JudgeProfile {
  id: string;
  name: string;
  imageSrc: string;
  role: LocalizedText;
  organization: LocalizedText;
  bio: LocalizedText;
  expertise: LocalizedText[];
  avatarTone: string;
  rounds: CompetitionRoundKey[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  competitionRole: LocalizedText;
  university: string;
  currentEmployment?: LocalizedText;
  avatarImageSrc: string;
  quote: LocalizedText;
}

export type ForumThreadCategory =
  | "looking-for-team"
  | "team-looking-for-members"
  | "general-discussion";

export type ForumThreadStatus = "open" | "closed";

export interface ForumAuthor {
  id: string;
  name: string;
  university: string;
  role: UserRole;
  avatarTone: string;
  avatarImageSrc?: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  editedByName?: string;
  deletedAt?: string;
  deletedByName?: string;
  author: ForumAuthor;
}

export interface ForumThread {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: ForumThreadCategory;
  status: ForumThreadStatus;
  university: string;
  preferredRoles: string[];
  contactNote: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  editedAt?: string;
  editedByName?: string;
  replyCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageAuthorName?: string;
  author: ForumAuthor;
  replies?: ForumReply[];
}

export type NewsContentBlock =
  | {
      type: "paragraph";
      body: LocalizedText;
    }
  | {
      type: "image";
      src: string;
      alt: LocalizedText;
      caption: LocalizedText;
      emphasis?: "standard" | "feature";
      origin?: "cover" | "body";
    };

export interface NewsPost {
  slug: string;
  category: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  author: string;
  publishedAt: string;
  readTime: string;
  coverLabel: LocalizedText;
  coverImageSrc: string;
  coverImageAlt: LocalizedText;
  featuredImageSrc?: string;
  featuredImageAlt?: LocalizedText;
  highlights: LocalizedText[];
  content: NewsContentBlock[];
  tags: string[];
}

export interface Round1QuestionOption {
  id: string;
  label: string;
  text: LocalizedText;
}

export type Round1QuestionDifficulty = "easy" | "medium" | "hard";
export type Round1QuestionType =
  | "true-false"
  | "single-choice"
  | "multiple-choice"
  | "pairing"
  | "essay";
export type Round1TestBankType = "objective" | "essay";

export interface Round1PairingItem {
  id: string;
  label: string;
  prompt: LocalizedText;
  correctOptionId: string;
}

export interface Round1Question {
  id: string;
  name?: string;
  prompt: LocalizedText;
  topic: string;
  difficulty: Round1QuestionDifficulty;
  type: Round1QuestionType;
  options?: Round1QuestionOption[];
  correctOptionIds?: string[];
  pairingItems?: Round1PairingItem[];
  rubricNote?: LocalizedText;
  placeholder?: LocalizedText;
}

export interface Round1TestBank {
  id: string;
  bankType: Round1TestBankType;
  title: LocalizedText;
  description: LocalizedText;
  status: "draft" | "active" | "archived";
  questionPoolSize: number;
  questionsPerAttempt: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  durationMinutes: number;
  wordLimit?: number;
  fixedEssayPrompt?: LocalizedText;
  publishedAt: string;
  questions: Round1Question[];
}

export interface Round1Submission {
  id: string;
  bankId: string;
  teamId: string;
  userId: string;
  submittedAt: string;
  rightCount: number;
  wrongCount: number;
  score: number;
  objectiveScore: number;
  essayScore: number | null;
  totalScore: number | null;
  durationMinutes: number;
  judgeReviews?: Array<{
    judgeUserId: string;
    judgeName: string;
    judgeLoginId?: string;
    score: number | null;
    source?: "ai" | "human";
    scoredAt?: string;
  }>;
  aiEssayReview?: {
    score: number | null;
    status: "not-started" | "scoring" | "scored" | "failed" | "skipped-human";
    model?: string;
    scoredAt?: string;
  };
}

export interface UserProfile {
  id: string;
  loginId?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: UserRole;
  judgeProfileId?: string;
  supporterReferralCode?: string;
  referredByCode?: string;
  referredBySupporterId?: string;
  studentId: string;
  phoneNumber: string;
  university: string;
  major: string;
  classYear: string;
  bio: string;
  avatarTone: string;
  avatarImageSrc?: string;
  providers: ("email" | "google")[];
}

export interface PublicUserProfile {
  id: string;
  name: string;
  role: UserRole;
  university: string;
  major: string;
  classYear: string;
  bio: string;
  avatarTone: string;
  avatarImageSrc?: string;
}

export type JudgeTaskStatus = "scored" | "pending";

export interface JudgeAssignmentSummary {
  userId: string;
  judgeProfileId: string;
  name: string;
  position: LocalizedText;
  organization: LocalizedText;
  rounds: CompetitionRoundKey[];
}

export interface JudgeDashboardRound1Task {
  kind: "round-1";
  submissionId: string;
  participantId: string;
  participantName: string;
  participantUniversity: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  submittedAt: string;
  status: JudgeTaskStatus;
  scoredAt?: string;
}

export interface JudgeDashboardTeamTask {
  kind: SubmissionRound;
  submissionId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  title: string;
  version: number;
  submittedAt: string;
  submittedByName: string;
  resourceLabel: string;
  resourceUrl?: string;
  status: JudgeTaskStatus;
  scoredAt?: string;
}

export type JudgeDashboardTask =
  | JudgeDashboardRound1Task
  | JudgeDashboardTeamTask;

export interface JudgeDashboardRoundGroup {
  round: CompetitionRoundKey;
  tasks: JudgeDashboardTask[];
}

export interface JudgeDashboardData {
  judge: JudgeAssignmentSummary;
  rounds: JudgeDashboardRoundGroup[];
}

export interface JudgeRound1EssayAnswer {
  questionId: string;
  order: number;
  prompt: LocalizedText;
  rubricNote?: LocalizedText;
  answerText: string;
  wordCount: number;
  score?: number | null;
  aiComment?: string | null;
}

export interface JudgeRound1Detail {
  round: "round-1";
  submissionId: string;
  participantId: string;
  participantName: string;
  participantUniversity: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  submittedAt: string;
  durationMinutes: number;
  rightCount: number;
  wrongCount: number;
  objectiveScore: number;
  essays: JudgeRound1EssayAnswer[];
  review: {
    score: number | null;
    note: string;
    scoredAt?: string;
    questionScores?: Record<string, number>;
  };
  maxScore: number;
}

export interface JudgeRubricCriterion {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  maxScore: number;
  levels: Array<{
    label: LocalizedText;
    range: string;
    guide: LocalizedText;
  }>;
}

export interface JudgeTeamSubmissionDetail {
  round: SubmissionRound;
  round3Bracket?: "finalist" | "emerging" | null;
  submissionId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  title: string;
  summary: string;
  version: number;
  submittedAt: string;
  submittedByName: string;
  resourceLabel: string;
  resourceUrl?: string;
  resourceMimeType?: string;
  resourceSizeBytes?: number;
  review: {
    score: number | null;
    note: string;
    scoredAt?: string;
    rubricScores?: Record<string, number>;
  };
  maxScore: number;
  rubric?: JudgeRubricCriterion[];
}

export interface EditableSectionCopy {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export interface EditableHeroSlideCard {
  label: LocalizedText;
  value: LocalizedText;
  note: LocalizedText;
}

export interface EditableHeroSlideCta {
  href: string;
  label: LocalizedText;
}

export interface EditableRewardCard {
  rank: LocalizedText;
  title: LocalizedText;
  amount: LocalizedText;
  note: LocalizedText;
}

export interface EditableRewardHighlight {
  eyebrow: LocalizedText;
  title: LocalizedText;
  amount: LocalizedText;
  note: LocalizedText;
}

export interface EditablePathBlock {
  eyebrow: LocalizedText;
  items: LocalizedText[];
  note: LocalizedText;
  ctaLabel?: LocalizedText;
  ctaHref?: string;
}

export interface EditableRulesJumpItem {
  shortLabel: LocalizedText;
  hoverLabel: LocalizedText;
}

export interface EditableRulesRoundSection extends RoundItem {
  focus: LocalizedText;
  specificRules: LocalizedText[];
  specificRulesRichText?: LocalizedText;
  roundNotes: LocalizedText[];
  round3EmergingRules?: LocalizedText;
  round3FinalRules?: LocalizedText;
}

export interface EditableJudgeRoundSection extends EditableSectionCopy {
  round: CompetitionRoundKey;
  panelNote: LocalizedText;
}

export interface EditableOrganizerSeasonStory {
  year: string;
  image: string;
  featuredImage?: string;
  label: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  stats: LocalizedText[];
}

export interface EditableOrganizerSeasonStat {
  value: string;
  label: LocalizedText;
}

export interface EditableOrganizerSeasonTeamMember {
  name: string;
  university: string;
  major: string;
}

export interface EditableOrganizerSeasonTeam {
  rank: LocalizedText;
  name: LocalizedText;
  projectName: LocalizedText;
  projectDescription: LocalizedText;
  members: EditableOrganizerSeasonTeamMember[];
}

export interface EditableOrganizerSeasonSlide {
  image: string;
  alt: LocalizedText;
}

export interface EditableOrganizerSeasonArchive {
  year: string;
  overviewTitle: LocalizedText;
  overview: LocalizedText[];
  stats: EditableOrganizerSeasonStat[];
  topTeams: EditableOrganizerSeasonTeam[];
  photoSlides: EditableOrganizerSeasonSlide[];
}

export interface EditableOrganizerGallerySlide {
  year: string;
  image: string;
  label: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export interface EditablePhoneContact {
  name: string;
  phone: string;
  tel: string;
  responsibility: LocalizedText;
}

export interface SystemEmailTemplate {
  subject: LocalizedText;
  preview: LocalizedText;
  headline: LocalizedText;
  intro: LocalizedText;
  actionLabel: LocalizedText;
  actionHint: LocalizedText;
  footer: LocalizedText;
}

export interface SystemEmailTemplates {
  activation: SystemEmailTemplate;
  passwordReset: SystemEmailTemplate;
}

export interface EditableHeroSlide {
  id: string;
  image: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  primaryCta: EditableHeroSlideCta;
  secondaryCta: EditableHeroSlideCta;
  cards: EditableHeroSlideCard[];
}

export interface EditableFooterSnapshotItem {
  label: LocalizedText;
  value: LocalizedText;
}

export interface EditableSiteFooterContent {
  brandLogoImage: string;
  brandTitle: LocalizedText;
  brandSubtitle: LocalizedText;
  description: LocalizedText;
  ctaLabel: LocalizedText;
  navigateHeading: LocalizedText;
  contactHeading: LocalizedText;
  attackerFacebookLabel: LocalizedText;
  ftcFacebookLabel: LocalizedText;
  snapshotHeading: LocalizedText;
  snapshotItems: EditableFooterSnapshotItem[];
  timelineLinkLabel: LocalizedText;
  copyright: LocalizedText;
}

export interface EditableRound1ResultsPageContent {
  releasedHeader: EditableSectionCopy;
  unreleasedHeader: EditableSectionCopy;
  loadingLabel: LocalizedText;
  errorLabel: LocalizedText;
  toBeAnnouncedLabel: LocalizedText;
  announcementDateLabel: LocalizedText;
  waitingNotice: LocalizedText;
  viewTimelineLabel: LocalizedText;
  openNewsLabel: LocalizedText;
  adminPreviewTitle: LocalizedText;
  adminPreviewDescription: LocalizedText;
  emptyState: EditableSectionCopy;
  listHeader: EditableSectionCopy;
  searchPlaceholder: LocalizedText;
  teamColumnLabel: LocalizedText;
  membersColumnLabel: LocalizedText;
  membersSuffix: LocalizedText;
  leaderLabel: LocalizedText;
  universityMissingLabel: LocalizedText;
  noSearchResults: EditableSectionCopy;
}

export interface EditableFinalistsGuidancePanel {
  title: LocalizedText;
  items: LocalizedText[];
  emailLabel: LocalizedText;
  reportLabel: LocalizedText;
}

export interface SitePageContent {
  siteHeader: {
    brandLogoImage: string;
    brandLogoLightImage: string;
    brandLogoDarkImage: string;
    slogan: LocalizedText;
    email: string;
    phone: string;
    facebookLabel: LocalizedText;
    facebookUrl: string;
  };
  footer: EditableSiteFooterContent;
  home: {
    heroSlides: EditableHeroSlide[];
    testimonials: TestimonialItem[];
    metrics: MetricItem[];
    rewards: EditableSectionCopy;
    rewardCards: EditableRewardCard[];
    emergingReward: EditableRewardHighlight;
    emergingRewardOpportunityNote: LocalizedText;
    competitionPath: EditablePathBlock;
    sponsorsStripLinkLabel: LocalizedText;
    testimonialsSection: EditableSectionCopy;
    testimonialsBadgeLabel: LocalizedText;
    testimonialsLinkLabel: LocalizedText;
    news: EditableSectionCopy;
    sponsors: EditableSectionCopy;
    destinations: EditableSectionCopy;
    cta: EditableSectionCopy;
  };
  construction: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    waitPrefix: LocalizedText;
    countdownLabel: LocalizedText;
    daysLabel: LocalizedText;
    hoursLabel: LocalizedText;
    minutesLabel: LocalizedText;
    secondsLabel: LocalizedText;
    authGateTitle: LocalizedText;
    authGateDescription: LocalizedText;
    passwordLabel: LocalizedText;
    passwordPlaceholder: LocalizedText;
    passwordSubmitLabel: LocalizedText;
    passwordError: LocalizedText;
  };
  competition: {
    intro: EditableSectionCopy;
    legacyHeroImage: string;
    pillarsTitle: LocalizedText;
    pillars: LocalizedText[];
    highlights: RuleItem[];
    rounds: EditableSectionCopy;
    roundCards: RoundItem[];
    rewards: EditableSectionCopy;
    rewardCards: EditableRewardCard[];
    emergingReward: EditableRewardHighlight;
    competitionPath: EditablePathBlock;
    mentors: EditableSectionCopy;
  };
  round1Results: EditableRound1ResultsPageContent;
  rules: {
    header: EditableSectionCopy;
    coreRules: EditableSectionCopy;
    introJumpItems: EditableRulesJumpItem[];
    quickReadLabel: LocalizedText;
    quickReadItems: LocalizedText[];
    generalHighlights: RuleItem[];
    generalPolicyChecksLabel: LocalizedText;
    generalPolicyChecks: RuleItem[];
    openTimelineOverviewLabel: LocalizedText;
    rounds: EditableRulesRoundSection[];
    openRoundOnTimelineLabel: LocalizedText;
    deliverablePrefix: LocalizedText;
    specificRoundRulesLabel: LocalizedText;
    roundNotesLabel: LocalizedText;
    faqQuickAnswersLabel: LocalizedText;
    faqQuickAnswers: LocalizedText[];
    faqQuestionPrefix: LocalizedText;
    faqTopics: FAQTopic[];
    faqItems: FAQItem[];
    timeline: EditableSectionCopy;
    faq: EditableSectionCopy;
  };
  news: {
    header: EditableSectionCopy;
    featured: EditableSectionCopy;
    latest: EditableSectionCopy;
    related: EditableSectionCopy;
  };
  sponsors: {
    header: EditableSectionCopy;
    partnership: EditableSectionCopy;
  };
  judges: {
    header: EditableSectionCopy;
    panelSizeLabel: LocalizedText;
    roundSections: EditableJudgeRoundSection[];
    clarity: EditableSectionCopy;
  };
  auth: {
    header: EditableSectionCopy;
    registerNote: LocalizedText;
    signinNote: LocalizedText;
  };
  workspace: {
    header: EditableSectionCopy;
    noTeamTitle: LocalizedText;
    noTeamDescription: LocalizedText;
    teamDescription: LocalizedText;
  };
  organizer: {
    header: EditableSectionCopy;
    heroBadges: LocalizedText[];
    heroCard: EditableSectionCopy;
    heroImage: string;
    metrics: MetricItem[];
    contentModules: EditableSectionCopy;
    competitionLinkLabel: LocalizedText;
    seasonBadgeLabel: LocalizedText;
    seasonStories: EditableOrganizerSeasonStory[];
    seasonArchives: EditableOrganizerSeasonArchive[];
    flags: EditableSectionCopy;
    gallerySlides: EditableOrganizerGallerySlide[];
    galleryCurrentFrame: EditableSectionCopy;
    galleryNotes: LocalizedText[];
    openFullViewLabel: LocalizedText;
    previousPhotoLabel: LocalizedText;
    nextPhotoLabel: LocalizedText;
    closeGalleryLabel: LocalizedText;
  };
  contact: {
    mapEyebrow: LocalizedText;
    campusName: LocalizedText;
    phoneContactsEyebrow: LocalizedText;
    phoneContacts: EditablePhoneContact[];
    responseRhythmEyebrow: LocalizedText;
    responseRhythmDescription: LocalizedText;
    officialEmailLabel: LocalizedText;
    officialEmailValue: string;
    primaryHotlineLabel: LocalizedText;
    primaryHotlineValue: string;
    supportWindowLabel: LocalizedText;
    supportWindowValue: string;
    organizerAddressEyebrow: LocalizedText;
    organizerAddress: LocalizedText;
    organizerAddressNote: LocalizedText;
    officialChannelsEyebrow: LocalizedText;
    attackerFacebookLabel: LocalizedText;
    attackerFacebookUrl: string;
    ftcFacebookLabel: LocalizedText;
    ftcFacebookUrl: string;
    openNewsroomLabel: LocalizedText;
  };
  timelinePage: {
    diagramEyebrow: LocalizedText;
    diagramHint: LocalizedText;
    scheduleToBeUpdated: LocalizedText;
    openDetailLabel: LocalizedText;
    openRuleBlockLabel: LocalizedText;
    readResultUpdateLabel: LocalizedText;
    finalistResultsLabel: LocalizedText;
    emergingResultsLabel: LocalizedText;
    round2SubmissionClosedTitle: LocalizedText;
    finalReportClosedTitle: LocalizedText;
    stepsLabel: LocalizedText;
    timeLabel: LocalizedText;
    placeLabel: LocalizedText;
    methodLabel: LocalizedText;
    nowLabel: LocalizedText;
    finishedLabel: LocalizedText;
    ongoingLabel: LocalizedText;
    startingSoonLabel: LocalizedText;
    notStartedLabel: LocalizedText;
    endsInPrefix: LocalizedText;
    startsInPrefix: LocalizedText;
    countdownDayUnit: LocalizedText;
    createAccountActionLabel: LocalizedText;
    registrationTeamLockTitle: LocalizedText;
    eligibilityCheckLabel: LocalizedText;
    closeEligibilityMessageLabel: LocalizedText;
    gotItLabel: LocalizedText;
    eligibilitySignInTitle: LocalizedText;
    eligibilitySignInDescription: LocalizedText;
    eligibilitySignInReason: LocalizedText;
    eligibilityWrongRoleTitle: LocalizedText;
    eligibilityWrongRoleDescription: LocalizedText;
    eligibilityWrongRoleReason: LocalizedText;
    eligibilityNoTeamTitle: LocalizedText;
    eligibilityNoTeamDescription: LocalizedText;
    eligibilityNoTeamReason: LocalizedText;
    eligibilityAdvancedTitle: LocalizedText;
    eligibilityAdvancedDescription: LocalizedText;
    eligibilityEligibleTitle: LocalizedText;
    eligibilityEligibleDescription: LocalizedText;
    eligibilityMinMembersMetReason: LocalizedText;
    eligibilityTeamLockCompletedReason: LocalizedText;
    eligibilityRound1AvailableReason: LocalizedText;
    eligibilityMinMembersMissingReason: LocalizedText;
    eligibilityTeamLockMissingReason: LocalizedText;
    eligibilityRound1ClosedReason: LocalizedText;
    eligibilityNotReadyTitle: LocalizedText;
    eligibilityNotReadyDescription: LocalizedText;
    eligibilityRound1UnavailableReason: LocalizedText;
    general: EditableSectionCopy;
    round1: EditableSectionCopy;
    round2: EditableSectionCopy;
    round3: EditableSectionCopy;
    round3Presentation: EditableSectionCopy;
  };
  finalists: {
    finalistsHeader: EditableSectionCopy;
    emergingHeader: EditableSectionCopy;
    finalistSlotLabel: LocalizedText;
    awaitingUpdateLabel: LocalizedText;
    finalistSlotDescription: LocalizedText;
    presentationDayLabel: LocalizedText;
    toBeAnnouncedLabel: LocalizedText;
    yourTeamLabel: LocalizedText;
    keywordPrefix: LocalizedText;
    finalistTeamLabel: LocalizedText;
    membersSuffix: LocalizedText;
    teamLeaderPrefix: LocalizedText;
    leaderInfoUpdating: LocalizedText;
    teamColumnLabel: LocalizedText;
    leaderColumnLabel: LocalizedText;
    keywordColumnLabel: LocalizedText;
    recognitionColumnLabel: LocalizedText;
    emergingTeamSlotLabel: LocalizedText;
    awaitingOfficialUpdate: LocalizedText;
    reservedLabel: LocalizedText;
    emergingTeamLabel: LocalizedText;
    finalistGuidance: EditableFinalistsGuidancePanel;
    emergingGuidance: EditableFinalistsGuidancePanel;
  };
  emergingResults: {
    header: EditableSectionCopy;
    announcementLabel: LocalizedText;
    toBeAnnouncedLabel: LocalizedText;
    releasedLabel: LocalizedText;
    pendingLabel: LocalizedText;
    awardTeamsLabel: LocalizedText;
    emptySlotTitle: LocalizedText;
    loadingSlotDescription: LocalizedText;
    pendingSlotDescription: LocalizedText;
    yourTeamLabel: LocalizedText;
    awardLabel: LocalizedText;
    membersSuffix: LocalizedText;
    leaderLabel: LocalizedText;
  };
  finalResults: {
    champion: EditableSectionCopy;
    runnerUp: EditableSectionCopy;
    thirdPlace: EditableSectionCopy;
    fourthPlace: EditableSectionCopy;
    memberSlotLabel: LocalizedText;
    awaitingOfficialTeamLineup: LocalizedText;
    resultPendingLabel: LocalizedText;
    yourTeamLabel: LocalizedText;
    awaitingOfficialAnnouncement: LocalizedText;
    awaitingOfficialAnnouncementBody: LocalizedText;
    keywordPrefix: LocalizedText;
    leaderPrefix: LocalizedText;
    leaderInfoPending: LocalizedText;
    teamMembersLabel: LocalizedText;
    finalStandingsEyebrow: LocalizedText;
    finalStandingsTitle: LocalizedText;
    presentationDayLabel: LocalizedText;
    presentationDateValue: LocalizedText;
    presentationPlaceLabel: LocalizedText;
    presentationPlaceValue: LocalizedText;
    toBeAnnouncedLabel: LocalizedText;
  };
  forum: {
    searchPlaceholder: LocalizedText;
    allThreadsLabel: LocalizedText;
    matchingThreadsSuffix: LocalizedText;
    allCategoriesDescription: LocalizedText;
    backToThreadListLabel: LocalizedText;
    lastActivityLabel: LocalizedText;
    closedByOwnerLabel: LocalizedText;
    repliesSuffix: LocalizedText;
    loadingDiscussionLabel: LocalizedText;
    repliesSectionLabel: LocalizedText;
    noReplyYetLabel: LocalizedText;
    joinConversationLabel: LocalizedText;
    closedThreadNotice: LocalizedText;
    signedInReplyNotice: LocalizedText;
    signInNowLabel: LocalizedText;
    replyPlaceholder: LocalizedText;
    postReplyLabel: LocalizedText;
    activeThreadsSuffix: LocalizedText;
    sortedByRecentActivityLabel: LocalizedText;
    openThreadLabel: LocalizedText;
    signInToParticipateLabel: LocalizedText;
    loadingThreadsLabel: LocalizedText;
    noMatchingThreadTitle: LocalizedText;
    noMatchingThreadDescription: LocalizedText;
    newThreadEyebrow: LocalizedText;
    newThreadTitle: LocalizedText;
    closeDialogLabel: LocalizedText;
    threadTitleFieldLabel: LocalizedText;
    categoryFieldLabel: LocalizedText;
    rolesSkillsFieldLabel: LocalizedText;
    rolesSkillsPlaceholder: LocalizedText;
    shortSummaryFieldLabel: LocalizedText;
    mainPostFieldLabel: LocalizedText;
    contactNoteFieldLabel: LocalizedText;
    contactNotePlaceholder: LocalizedText;
    publishThreadLabel: LocalizedText;
    clearFormLabel: LocalizedText;
    closeThreadConfirmTitle: LocalizedText;
    closeThreadConfirmDescription: LocalizedText;
    cancelLabel: LocalizedText;
    closeThreadLabel: LocalizedText;
    categoryLookingForTeamLabel: LocalizedText;
    categoryLookingForTeamDescription: LocalizedText;
    categoryTeamRecruitingLabel: LocalizedText;
    categoryTeamRecruitingDescription: LocalizedText;
    categoryGeneralDiscussionLabel: LocalizedText;
    categoryGeneralDiscussionDescription: LocalizedText;
  };
}

export interface TeamProfile {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  memberIds: string[];
  stage: CompetitionStage;
  round2Advancement?: Round2AdvancementBracket;
  finalOutcome?: TeamFinalOutcome;
  finalScore?: number;
  finalScoreUpdatedAt?: string;
  round1LockStatus: TeamRound1LockStatus;
  round1LockProtocolId?: string;
  round1LockRequestedAt?: string;
  round1LockedAt?: string;
  round1LockDeclinedAt?: string;
  round1LockDeclinedByUserId?: string;
  avatarTone: string;
  avatarImageSrc?: string;
  track: string;
  bio: string;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface LeadershipTransferRequest {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface Round1TeamLockRequest {
  id: string;
  protocolId: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  respondedAt?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface TeamSubmission {
  id: string;
  teamId: string;
  round: SubmissionRound;
  version: number;
  title: string;
  summary: string;
  resourceSource: "external" | "upload";
  resourceLabel: string;
  resourceUrl?: string;
  resourceStorageKey?: string;
  resourceMimeType?: string;
  resourceSizeBytes?: number;
  submittedByUserId: string;
  submittedAt: string;
}

export interface AppSnapshot {
  locale: Locale;
  theme: Theme;
  activeUserId: string;
  users: UserProfile[];
  teams: TeamProfile[];
  invitations: TeamInvitation[];
  leadershipTransferRequests: LeadershipTransferRequest[];
  teamLockRequests: Round1TeamLockRequest[];
  submissions: TeamSubmission[];
  round1TestBanks: Round1TestBank[];
  round1Topics: string[];
  round1Submissions: Round1Submission[];
  newsPosts: NewsPost[];
  sponsors: SponsorProfile[];
  judges: JudgeProfile[];
  timelineItems: TimelineItem[];
  pageContent: SitePageContent;
}
