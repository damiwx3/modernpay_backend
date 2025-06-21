import 'package:flutter/material.dart';
import '../../../services/contribution_service.dart';

class MissedContributionsScreen extends StatefulWidget {
  final int contributionsGroupId;
  const MissedContributionsScreen({Key? key, required this.contributionsGroupId}) : super(key: key);

  @override
  State<MissedContributionsScreen> createState() => _MissedContributionsScreenState();
}

class _MissedContributionsScreenState extends State<MissedContributionsScreen> {
  final _svc = ContributionService();

  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _missed = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _svc.getMissedContributions(groupId: widget.contributionsGroupId);
      setState(() {
        _missed = data.cast<Map<String, dynamic>>();
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _remind(int userId) async {
    // Replace with real reminder logic if needed
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Reminder sent to user $userId')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Missed Contributions')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _missed.isEmpty
                  ? const Center(child: Text('No missed contributions'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _missed.length,
                      itemBuilder: (_, i) {
                        final m = _missed[i];
                        final user = m['User'] ?? {};
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          child: ListTile(
                            title: Text(user['fullName'] ?? 'Unknown'),
                            subtitle: Text('Due: ₦${m['amount'] ?? '-'}'),
                            trailing: ElevatedButton(
                              onPressed: () => _remind(user['id'] ?? 0),
                              child: const Text('Remind'),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}