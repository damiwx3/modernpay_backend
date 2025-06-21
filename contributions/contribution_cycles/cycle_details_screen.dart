import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../services/contribution_cycle_service.dart';
import '../../../services/contribution_service.dart';

class CycleDetailsScreen extends StatefulWidget {
  final int cycleId;
  const CycleDetailsScreen({Key? key, required this.cycleId}) : super(key: key);

  @override
  State<CycleDetailsScreen> createState() => _CycleDetailsScreenState();
}

class _CycleDetailsScreenState extends State<CycleDetailsScreen> {
  final _cycleSvc = ContributionCycleService();
  final _contSvc = ContributionService();
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _cycle;
  List<dynamic> _payments = [];
  bool _paid = false;
  int? _currentUserId; // Remove if not needed

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
      final det = await _cycleSvc.getCycleById(widget.cycleId);
      final userId = await _contSvc.getCurrentUserId();
      _currentUserId = userId; // Remove this line if you don't use _currentUserId

      // Fetch payments for this cycle
      final payments = await _cycleSvc.getCyclePayments(widget.cycleId);
      final paid = payments.any((p) =>
          (p['userId'] == userId || p['memberId'] == userId) &&
          (p['status'] == 'success' || p['status'] == 'paid'));
      setState(() {
        _cycle = det!;
        _payments = payments;
        _paid = paid;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load cycle: ${e.toString()}';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _pay() async {
    if (_paid) return;
    setState(() {
      _loading = true;
    });
    try {
      await _cycleSvc.makeContribution(
        widget.cycleId,
        _cycle!['amount'] is int
            ? (_cycle!['amount'] as int).toDouble()
            : _cycle!['amount'],
      );
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Payment successful')));
      setState(() {
        _paid = true;
      });
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Payment failed: ${e.toString()}')));
    } finally {
      _load();
    }
  }

  String _formatDate(dynamic dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr.toString());
      return DateFormat.yMMMd().format(date);
    } catch (_) {
      return dateStr.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cycle Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text('Cycle #${_cycle?['cycleNumber'] ?? ''}',
                        style: const TextStyle(fontSize: 20)),
                    const SizedBox(height: 8),
                    Text(
                        '${_formatDate(_cycle?['startDate'])} → ${_formatDate(_cycle?['endDate'])}'),
                    const SizedBox(height: 8),
                    Chip(label: Text(_cycle?['status'] ?? '')),
                    const Divider(height: 32),
                    ElevatedButton(
                      onPressed: _paid ? null : _pay,
                      child: _paid ? const Text('Paid') : const Text('Make Contribution'),
                    ),
                    const SizedBox(height: 16),
                    const Text('Payments', style: TextStyle(fontSize: 18)),
                    const SizedBox(height: 8),
                    if (_payments.isEmpty)
                      const Text('No payments yet.')
                    else
                      ..._payments.map((p) => Card(
                            child: ListTile(
                              leading: Icon(
                                p['status'] == 'success' || p['status'] == 'paid'
                                    ? Icons.check_circle
                                    : Icons.hourglass_empty,
                                color: p['status'] == 'success' || p['status'] == 'paid'
                                    ? Colors.green
                                    : Colors.orange,
                              ),
                              title: Text(
                                  'User: ${p['user']?['fullName'] ?? p['userId'] ?? p['memberId']}'),
                              subtitle: Text(
                                  'Amount: ${p['amount']} | Status: ${p['status']}'),
                              trailing: p['paidAt'] != null
                                  ? Text(_formatDate(p['paidAt']))
                                  : null,
                            ),
                          )),
                  ],
                ),
    );
  }
}