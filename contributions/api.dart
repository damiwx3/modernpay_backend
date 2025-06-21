class Api {
  static const String baseUrl = 'https://modernpay-backend.onrender.com/api';

  // Auth
  static const String register = '$baseUrl/auth/register';
  static const String login = '$baseUrl/auth/login';
  static const String verifyOtp = '$baseUrl/auth/verify-otp';
  static const String resendOtp = '$baseUrl/auth/resend-otp';
  static const String forgotPassword = '$baseUrl/auth/forgot-password';
  static const String resetPassword = '$baseUrl/auth/reset-password';

  // Wallet
  static const String getBalance = '$baseUrl/wallets/balance';
  static const String fundWallet = '$baseUrl/wallets/fund';
  static const String transferToUser = '$baseUrl/wallets/transfer';
  static const String transferToBank = '$baseUrl/wallets/transfer-to-bank';
  static const String walletTransactions = '$baseUrl/wallets/transactions';
  static const String getTransactionByReference = '$baseUrl/wallets/transaction'; // Usage: /{reference}
  static const String getSupportedDedicatedBanks = '$baseUrl/wallets/supported-dedicated-banks';
  static const String createVirtualAccount = '$baseUrl/wallets/create-virtual-account';
  static String userByAccount(String accountNumber) => '$baseUrl/wallets/user-by-account/$accountNumber';
  
 // static const String createVirtualAccount = '$baseUrl/wallets/create-account';

 //static const String getTransactionByReference = '$baseUrl/wallets/transaction';
static const String setTransactionPin = '$baseUrl/wallets/set-pin';
//static const String createVirtualAccount = '$baseUrl/wallets/create-virtual-account';
 
 
 
 

 static const String getBanks = '$baseUrl/bank/list';
  static const String verifyBankAccount = '$baseUrl/bank/verify';

  // Wallet
//static const String createVirtualAccount = '$baseUrl/wallets/create-virtual-account'; // POST

  // Bills
 static const String purchaseMtnVtu = '$baseUrl/bills/mtn-vtu'; // POST
static const String vtuStatus = '$baseUrl/bills/vtu-status';   // POST
static const String billCategories = '$baseUrl/bills/categories'; // GET
static const String billAirtimeCategories = '$baseUrl/bills/categories/airtime'; // GET
static const String billDataCategories = '$baseUrl/bills/categories/data'; // GET
static const String validateBillCustomer = '$baseUrl/bills/validate'; // POST
static const String payBill = '$baseUrl/bills/pay'; // POST
static const String billHistory = '$baseUrl/bills/history'; // GET
static String getBundles(String billerCode) => '$baseUrl/bills/bundles/$billerCode'; // GET
static String getServicesByCategory(String identifier) => '$baseUrl/bills/services-by-category?identifier=$identifier'; // GET


  // Bank
  static const String bankList = '$baseUrl/bank/list';
  static const String bankVerify = '$baseUrl/bank/verify';
  


  // User
 // static const String getUserProfile = '$baseUrl/users/profile';
  //static const String getUserById = '$baseUrl/users';
  //static const String updateUserProfile = '$baseUrl/users/profile';
  //static const String userProfile = '$baseUrl/users/profile';
  //static const String updateProfile = '$baseUrl/users/profile/update';

   static const String userProfile = '$baseUrl/users/profile'; // GET/PUT for profile (correct for backend)
  static const String getUserById = '$baseUrl/users'; // GET /users/{id}
  static const String verifyAccount = '$baseUrl/users/verify-account'; // POST;


  // Campaigns
static const String campaigns = '$baseUrl/campaigns'; // GET all campaigns
static String claimCampaign(int campaignId) => '$baseUrl/campaigns/claim/$campaignId'; // POST
static const String referralBonus = '$baseUrl/campaigns/referral/bonus'; // POST
static const String loyaltyStatus = '$baseUrl/campaigns/loyalty'; // GET
static const String adminCreateCampaign = '$baseUrl/campaigns/admin'; // POST (admin)


  
  // Contribution Cycles
static const String contributionCycles = '$baseUrl/contribution-cycles'; // GET all, POST create
static String contributionCycleById(int id) => '$baseUrl/contribution-cycles/$id'; // GET by ID

 static const String contributionGroups = '$baseUrl/contributions/groups'; // GET all, POST create
  static String joinGroup(int groupId) => '$baseUrl/contributions/groups/$groupId/join'; // POST
  static String groupDetails(int groupId) => '$baseUrl/contributions/groups/$groupId'; // GET
  static String updateGroup(int groupId) => '$baseUrl/contributions/groups/$groupId'; // PUT
  static String inviteToGroup(int groupId) => '$baseUrl/contributions/groups/$groupId/invite'; // POST
  static String leaveGroup(int groupId) => '$baseUrl/contributions/groups/$groupId/leave'; // POST
  static String groupMembers(int groupId) => '$baseUrl/contributions/groups/$groupId/members'; // GET
  static String groupCycles(int groupId) => '$baseUrl/contributions/groups/$groupId/cycles'; // GET

  // ===== CYCLES =====
  static const String createCycle = '$baseUrl/contribution-cycles'; // POST
  static const String getCycles = '$baseUrl/contribution-cycles'; // GET all
  static String getCycleById(int id) => '$baseUrl/contribution-cycles/$id'; // GET
  static String makeContribution(int id) => '$baseUrl/contribution-cycles/$id/contribute'; // POST
  static String closeCycle(int id) => '$baseUrl/contribution-cycles/$id/close'; // POST
  static const String contributionSummary = '$baseUrl/contributions/summary';
  static String cyclePayments(int cycleId) => '$baseUrl/contribution-cycles/$cycleId/payments';
  

  // ===== PAYMENTS =====
  static const String payoutHistory = '$baseUrl/contributions/payout-history'; // GET
  static const String runContributionScheduler = '$baseUrl/contributions/scheduler/trigger'; // POST

  // ===== MISSED CONTRIBUTIONS =====
  static const String missedContributions = '$baseUrl/missed-contributions'; // GET

  // ===== CONTACTS / OTHERS =====
  static const String addContributionContact = '$baseUrl/contributions/contacts'; // POST


// Disputes
static const String raiseDispute = '$baseUrl/disputes'; // POST
static const String getAllDisputes = '$baseUrl/disputes'; // GET (admin)
static const String getMyDisputes = '$baseUrl/disputes/my'; // GET
static String resolveDispute(int id) => '$baseUrl/disputes/$id/resolve'; // POST
static String updateDispute(int id) => '$baseUrl/disputes/$id'; // PATCH

  
  // Referrals
  static const String myReferrals = '$baseUrl/referrals/my-referrals';
//static const String referralBonus = '$baseUrl/referrals/bonus';
  static const String applyReferralCode = '$baseUrl/referrals/apply-code';

  // Reports
  static const String monthlyStatement = '$baseUrl/reports/monthly-statement';
  static const String exportCSV = '$baseUrl/reports/export-csv';

  //Security
  static const String setPin = '$baseUrl/api/wallets/set-pin';
  //static const String setPin = '$baseUrl/security/set-pin';
  static const String changePassword = '$baseUrl/security/change-password';
  static const String enable2FA = '$baseUrl/security/enable-2fa';
  static const String disable2FA = '$baseUrl/security/disable-2fa';
  static const String enableFaceId = '$baseUrl/security/enable-faceid';
  static const String disableFaceId = '$baseUrl/security/disable-faceid';


  //Notification
  static const String notifications = '$baseUrl/notifications';
  static const String notificationsUnreadCount = '$baseUrl/notifications/unread-count';
  static const String notificationsMarkAllRead = '$baseUrl/notifications/mark-read';
  static String notificationsMarkOneRead(String id) => '$baseUrl/notifications/$id/mark-read';

// Admin Dashboard
static const String adminDashboardOverview = '$baseUrl/admin-dashboard/overview'; // GET
static const String adminAuditLogs = '$baseUrl/admin-dashboard/audit-logs'; // GET
static const String adminKycQueue = '$baseUrl/admin-dashboard/kyc-queue'; // GET

// Admin KYC
static const String adminKycPending = '$baseUrl/admin-kyc/pending'; // GET
static String adminKycApprove(String kycId) => '$baseUrl/admin-kyc/$kycId/approve'; // POST
static String adminKycReject(String kycId) => '$baseUrl/admin-kyc/$kycId/reject';   // POST

// Admin
static const String adminUsers = '$baseUrl/admin/users'; // GET all users
static String adminUserById(int id) => '$baseUrl/admin/user/$id'; // GET, PUT, DELETE user by ID
static const String adminSummary = '$baseUrl/admin/summary'; // GET
static const String adminBlockWallet = '$baseUrl/admin/wallet/block'; // POST

// Audit Logs
static const String auditLogs = '$baseUrl/audit/logs'; // GET all audit logs
static String auditLogById(int id) => '$baseUrl/audit/logs/$id'; // GET audit log by ID

  // Savings
static const String createSavingsGoal = '$baseUrl/savings/create-goal';
static const String savingsGoals = '$baseUrl/savings/goals'; // GET all goals
static String savingsGoalById(int id) => '$baseUrl/savings/goals/$id'; // GET, PUT, DELETE by ID
static String completeSavingsGoal(int id) => '$baseUrl/savings/goals/$id/complete'; // POST
static const String depositToSavings = '$baseUrl/savings/deposit'; // POST
static const String withdrawFromSavings = '$baseUrl/savings/withdraw'; // POST

  // Tickets
  static const String createTicket = '$baseUrl/tickets';
  static const String myTickets = '$baseUrl/tickets/my';
  static String ticketById(String id) => '$baseUrl/tickets/$id';
  static String replyToTicket(String id) => '$baseUrl/tickets/$id/reply';
  static String closeTicket(String id) => '$baseUrl/tickets/$id/close';

  // Loans
  static const String applyLoan = '$baseUrl/loans/apply'; // POST
static const String myLoans = '$baseUrl/loans/my-loans'; // GET
static String loanById(int id) => '$baseUrl/loans/$id'; // GET
static String repayLoan(int id) => '$baseUrl/loans/$id/repay'; // POST
static String toggleAutoPayment(int id) => '$baseUrl/loans/$id/toggle-auto-payment'; // POST

// Virtual Cards
static const String createVirtualCard = '$baseUrl/virtual-cards/create'; // POST
static const String getVirtualCard = '$baseUrl/virtual-cards'; // GET
static const String freezeVirtualCard = '$baseUrl/virtual-cards/freeze'; // POST
static const String virtualCardTransactions = '$baseUrl/virtual-cards/transactions'; // GET
static const String topUpVirtualCard = '$baseUrl/virtual-cards/topup'; // POST
static const String setVirtualCardLimit = '$baseUrl/virtual-cards/limit'; // POST
static const String deleteVirtualCard = '$baseUrl/virtual-cards/delete'; // DELETE

// Admin Auth
static const String adminLogin = '$baseUrl/admin-auth/login'; // POST
static const String adminVerifyOtp = '$baseUrl/admin-auth/verify-otp'; // POST

// Settings (Admin)
static const String getAllSettings = '$baseUrl/settings'; // GET
static const String updateSetting = '$baseUrl/settings'; // PUT

// System
static const String systemStatus = '$baseUrl/system/status'; // GET
static const String setMaintenanceMode = '$baseUrl/system/maintenance'; // POST

// Tickets
//static const String createTicket = '$baseUrl/tickets'; // POST (user creates ticket)
//static const String myTickets = '$baseUrl/tickets/my'; // GET (user's tickets)
static const String adminAllTickets = '$baseUrl/tickets/admin'; // GET (admin: all tickets)
static String adminRespondToTicket(int id) => '$baseUrl/tickets/admin/$id/respond'; // PUT (admin responds)

static const String uploadKyc = '$baseUrl/kyc/upload'; // POST (multipart)
static const String kycStatus = '$baseUrl/kyc/status'; // GET

static const String verifyPhoneSelfieBvn = '$baseUrl/kyc/verify-phone-selfie-bvn'; // POST
static const String verifyGovernmentId = '$baseUrl/kyc/verify-government-id'; // POST
//static const String verifyAddressUtilityBill = '$baseUrl/kyc/verify-address-utility-bill'; // POST
//static const String verifyUtilityBill = '$baseUrl/kyc/verify-utility-bill'; // POST
static const String verifyUtilityBill = '$baseUrl/kyc/verify-address-utility-bill'; // POST
// Transactions
//static const String walletTransactions = '$baseUrl/wallets/transactions'; // GET (history), POST (manual)
static const String exportTransactions = '$baseUrl/wallets/export'; // GET (export transactions)

// User Contacts
static const String userContacts = '$baseUrl/contacts'; // GET (list), POST (add)
static String removeUserContact(int contactId) => '$baseUrl/contacts/$contactId'; // DELETE

 

  // Notifications
  static const String notify = '$baseUrl/notify';
  static const String bulkNotify = '$baseUrl/notify/bulk';

  // Webhooks
  static const String flutterwaveWebhook = '$baseUrl/webhooks/flutterwave';
  
}