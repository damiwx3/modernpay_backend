import 'package:flutter/material.dart';
import '../../../services/contribution_service.dart';

class GroupDetailsScreen extends StatefulWidget {
  final int groupId;
  const GroupDetailsScreen({Key? key, required this.groupId}) : super(key: key);

  @override
  State<GroupDetailsScreen> createState() => _GroupDetailsScreenState();
}

class _GroupDetailsScreenState extends State<GroupDetailsScreen> {
  final _svc = ContributionService();
  bool _loading = true;
  bool _processing = false;
  String? _error;
  Map<String, dynamic>? _group;
  List<dynamic> _members = [];
  bool _joined = false;
  bool _isAdmin = false;
  int? _currentUserId;

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
      final det = await _svc.getGroupDetails(widget.groupId);
      final mems = await _svc.getGroupMembers(widget.groupId);
      final userId = await _svc.getCurrentUserId();
      final joinedMember = mems.firstWhere(
        (m) => (m['userId'] == userId) || (m['User']?['id'] == userId),
        orElse: () => null,
      );
      setState(() {
        _group = det['group'];
        _members = mems;
        _joined = joinedMember != null;
        _isAdmin = joinedMember != null && (joinedMember['isAdmin'] == true);
        _currentUserId = userId;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load details: ${e.toString()}';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _toggleJoin() async {
    setState(() {
      _processing = true;
    });
    try {
      if (_joined) {
        await _svc.leaveGroup(widget.groupId);
      } else {
        await _svc.joinGroup(widget.groupId);
      }
      await _load();
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    } finally {
      setState(() {
        _processing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Group Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_group?['imageUrl'] != null)
                        Semantics(
                          label: 'Group image',
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              _group!['imageUrl'],
                              height: 160,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(_group?['name'] ?? '',
                          style: const TextStyle(
                              fontSize: 22, fontWeight: FontWeight.bold)),
                      if (_group?['description'] != null)
                        Text(_group!['description']),
                      const SizedBox(height: 12),
                      Wrap(spacing: 16, children: [
                        Chip(
                            label: Text(
                                '₦${_group?['amountPerMember'] ?? ''}')),
                        Chip(
                            label: Text(
                                '${_members.length}/${_group?['maxMembers'] ?? '-'} members')),
                        Chip(label: Text(_group?['frequency'] ?? '')),
                      ]),
                      const Divider(height: 32),
                      Row(
                        children: [
                          ElevatedButton(
                            onPressed: _processing ? null : _toggleJoin,
                            child: _processing
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : Text(_joined ? 'Leave Group' : 'Join Group'),
                          ),
                          if (_isAdmin) ...[
                            const SizedBox(width: 16),
                            ElevatedButton(
                                onPressed: _processing
                                    ? null
                                    : () => Navigator.pushNamed(
                                          context,
                                          '/contribution/groups/invite',
                                          arguments: widget.groupId,
                                        ).then((_) => _load()),
                                child: const Text('Invite')),
                            const SizedBox(width: 16),
                            ElevatedButton(
                                onPressed: _processing
                                    ? null
                                    : () => Navigator.pushNamed(
                                          context,
                                          '/contribution/groups/edit',
                                          arguments: widget.groupId,
                                        ).then((_) => _load()),
                                child: const Text('Edit')),
                          ],
                        ],
                      ),
                      const SizedBox(height: 24),
                      const Text('Members', style: TextStyle(fontSize: 18)),
                      const SizedBox(height: 8),
                      Container(
                        constraints: const BoxConstraints(maxHeight: 350),
                        child: _members.isEmpty
                            ? const Text('No members yet.')
                            : ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _members.length,
                                separatorBuilder: (_, __) => const Divider(height: 1),
                                itemBuilder: (context, i) {
                                  final m = _members[i];
                                  final u = m['User'] as Map<String, dynamic>? ??
                                      {'fullName': 'Unknown', 'email': ''};
                                  final isCurrentUser = u['id'] == _currentUserId;
                                  return ListTile(
                                    leading: u['profileImage'] != null
                                        ? CircleAvatar(
                                            backgroundImage:
                                                NetworkImage(u['profileImage']),
                                          )
                                        : CircleAvatar(
                                            child: Text(
                                              (u['fullName'] ?? 'U')
                                                  .toString()
                                                  .substring(0, 1),
                                            ),
                                          ),
                                    title: Row(
                                      children: [
                                        Text(u['fullName'] ?? ''),
                                        if (isCurrentUser)
                                          const Padding(
                                            padding: EdgeInsets.only(left: 6),
                                            child: Text(
                                              '(You)',
                                              style: TextStyle(
                                                  fontSize: 12,
                                                  color: Colors.blueGrey),
                                            ),
                                          ),
                                      ],
                                    ),
                                    subtitle: Text(u['email'] ?? ''),
                                    trailing: (m['isAdmin'] == true)
                                        ? const Icon(Icons.star,
                                            color: Colors.amber, size: 20)
                                        : null,
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }
}