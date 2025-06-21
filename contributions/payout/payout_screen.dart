import 'package:flutter/material.dart';
import '../../../services/contribution_cycle_service.dart';
import '../../../services/contribution_service.dart';

class PayoutScreen extends StatefulWidget {
  final int cycleId;
  const PayoutScreen({Key? key, required this.cycleId}) : super(key: key);

  @override
  State<PayoutScreen> createState() => _PayoutScreenState();
}

class _PayoutScreenState extends State<PayoutScreen> {
  bool? _isAdmin;
  bool _loading = true;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _checkAdminStatus();
  }

  Future<void> _checkAdminStatus() async {
    setState(() { _loading = true; });
    try {
      // Fetch cycle details to get groupId
      final cycle = await ContributionCycleService().getCycleById(widget.cycleId);
      final groupId = cycle?['groupId'];
      if (groupId == null) throw Exception('Group not found for cycle');
      final members = await ContributionService().getGroupMembers(groupId);
      final userId = await ContributionService().getCurrentUserId();
      final member = members.firstWhere(
        (m) => (m['userId'] == userId) || (m['User']?['id'] == userId),
        orElse: () => null,
      );
      setState(() {
        _isAdmin = member != null && (member['isAdmin'] == true);
      });
    } catch (e) {
      setState(() {
        _isAdmin = false;
      });
    } finally {
      setState(() { _loading = false; });
    }
  }

  Future<void> _confirmAndClose(BuildContext ctx) async {
    final confirmed = await showDialog<bool>(
      context: ctx,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Payout'),
        content: const Text('Are you sure you want to close this cycle and release payout? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yes, Release'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      _close(ctx);
    }
  }

  Future<void> _close(BuildContext ctx) async {
    setState(() {
      _processing = true;
    });
    try {
      await ContributionCycleService().closeCycle(widget.cycleId);
      if (mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          const SnackBar(content: Text('Payout released')),
        );
        Navigator.pop(ctx, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(content: Text('Error releasing payout: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _processing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Release Payout')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: _loading
              ? const CircularProgressIndicator()
              : (_isAdmin == true)
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Are you sure you want to close this cycle and release payout?',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        _processing
                            ? const CircularProgressIndicator()
                            : ElevatedButton(
                                onPressed: () => _confirmAndClose(context),
                                child: const Text('Release Payout'),
                              ),
                      ],
                    )
                  : const Text(
                      'Only group admins can release payouts.',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
        ),
      ),
    );
  }
}