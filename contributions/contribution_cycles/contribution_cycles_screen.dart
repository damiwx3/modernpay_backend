import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../services/contribution_cycle_service.dart';

class ContributionCyclesScreen extends StatefulWidget {
  final int groupId;
  final bool isAdmin;
  const ContributionCyclesScreen({Key? key, required this.groupId, this.isAdmin = false}) : super(key: key);

  @override
  State<ContributionCyclesScreen> createState() => _ContributionCyclesScreenState();
}

class _ContributionCyclesScreenState extends State<ContributionCyclesScreen> {
  final _svc = ContributionCycleService();
  bool _loading = true;
  String? _error;
  List<dynamic> _cycles = [];

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
      final data = await _svc.getGroupCycles(widget.groupId);
      setState(() {
        _cycles = data;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load cycles';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat.yMMMd().format(date);
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contribution Cycles')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _cycles.isEmpty
                  ? const Center(child: Text('No cycles yet.'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _cycles.length,
                        itemBuilder: (_, i) {
                          final c = _cycles[i] as Map<String, dynamic>;
                          return Card(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            child: ListTile(
                              title: Text('Cycle #${c['cycleNumber'] ?? (i + 1)}'),
                              subtitle: Text(
                                '${_formatDate(c['startDate'])} → ${_formatDate(c['endDate'])}',
                              ),
                              trailing: Chip(label: Text(c['status'] ?? '')),
                              onTap: () => Navigator.pushNamed(
                                context,
                                '/contribution/cycles/details',
                                arguments: c['id'],
                              ).then((_) => _load()),
                            ),
                          );
                        },
                      ),
                    ),
      floatingActionButton: widget.isAdmin
          ? FloatingActionButton(
              onPressed: () => Navigator.pushNamed(
                context,
                '/contribution/cycles/create',
                arguments: widget.groupId,
              ).then((_) => _load()),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}