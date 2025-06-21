import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../services/contribution_service.dart';

class ContributionGroupsScreen extends StatefulWidget {
  const ContributionGroupsScreen({Key? key}) : super(key: key);

  @override
  State<ContributionGroupsScreen> createState() => _ContributionGroupsScreenState();
}

class _ContributionGroupsScreenState extends State<ContributionGroupsScreen> {
  final _svc = ContributionService();
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _groups = [];

  final _currency = NumberFormat.currency(locale: 'en_NG', symbol: '₦');

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getGroups();
      setState(() {
        _groups = data.cast<Map<String, dynamic>>();
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load groups';
      });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Contribution Groups')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _groups.isEmpty
                  ? const Center(child: Text('No groups yet.'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _groups.length,
                        itemBuilder: (_, i) {
                          final g = _groups[i];
                          return Card(
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            child: ListTile(
                              title: Text(
                                g['name'] ?? '',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(
                                '${_currency.format(g['amountPerMember'] ?? 0)} • ${g['membersCount'] ?? '-'} members',
                              ),
                              trailing: const Icon(Icons.arrow_forward_ios),
                              onTap: () => Navigator.pushNamed(
                                context,
                                '/contribution/groups/details',
                                arguments: g['id'],
                              ).then((_) => _load()),
                            ),
                          );
                        },
                      ),
                    ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/contribution/groups/create')
            .then((_) => _load()),
        child: const Icon(Icons.add),
      ),
    );
  }
}