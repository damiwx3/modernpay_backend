import 'package:flutter/material.dart';
import '../../../services/contribution_service.dart';

class InviteMembersScreen extends StatefulWidget {
  final int groupId;
  const InviteMembersScreen({Key? key, required this.groupId}) : super(key: key);

  @override
  State<InviteMembersScreen> createState() => _InviteMembersScreenState();
}

class _InviteMembersScreenState extends State<InviteMembersScreen> {
  final _form = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  String? _error, _success;

  Future<void> _send() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; _success = null; });
    try {
      await ContributionService().sendGroupInviteByEmail(widget.groupId, _emailCtrl.text);
      setState(() { _success = 'Invitation sent!'; });
      _emailCtrl.clear();
    } catch (e) {
      setState(() { _error = 'Failed to send: ${e.toString()}'; });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Invite Member')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _form,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _emailCtrl,
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+');
                        if (!emailRegex.hasMatch(v)) return 'Enter a valid email';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    if (_error != null)
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    if (_success != null)
                      Text(_success!, style: const TextStyle(color: Colors.green)),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: _send,
                      child: const Text('Send Invitation'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}