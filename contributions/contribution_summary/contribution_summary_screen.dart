import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../services/contribution_service.dart';

class ContributionSummaryScreen extends StatefulWidget {
  const ContributionSummaryScreen({Key? key}) : super(key: key);

  @override
  State<ContributionSummaryScreen> createState() => _ContributionSummaryScreenState();
}

class _ContributionSummaryScreenState extends State<ContributionSummaryScreen> {
  final _svc = ContributionService();
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _summary;

  final _currency = NumberFormat.currency(locale: 'en_NG', symbol: '₦');

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
      final result = await _svc.getContributionSummary();
      setState(() {
        _summary = result;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load summary';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contribution Summary')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _summary == null
                  ? const Center(child: Text('No summary available.'))
                  : Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Contributed: ${_currency.format(_summary!['totalContributed'] ?? 0)}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Total Received: ${_currency.format(_summary!['totalReceived'] ?? 0)}',
                            style: const TextStyle(fontSize: 16),
                          ),
                          const SizedBox(height: 16),
                          const Text('Recent Cycles:', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          if ((_summary!['recentCycles'] as List?)?.isEmpty ?? true)
                            const Text('No recent cycles.'),
                          ...((_summary!['recentCycles'] as List?) ?? []).map((c) => ListTile(
                                title: Text('Cycle #${c['cycleNumber'] ?? ''}'),
                                subtitle: Text(c['status'] ?? ''),
                              )),
                        ],
                      ),
                    ),
    );
  }
}