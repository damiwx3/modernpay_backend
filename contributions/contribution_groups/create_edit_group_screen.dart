import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../services/contribution_service.dart';

class CreateEditGroupScreen extends StatefulWidget {
  final int? groupId;
  const CreateEditGroupScreen({Key? key, this.groupId}) : super(key: key);

  @override
  State<CreateEditGroupScreen> createState() => _CreateEditGroupScreenState();
}

class _CreateEditGroupScreenState extends State<CreateEditGroupScreen> {
  final _form = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _amtCtrl = TextEditingController();
  final _maxCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _frequency = 'Weekly';
  String _schedule = 'Cycle End';
  bool _isPublic = false;
  bool _loading = false;
  String? _error;
  File? _imageFile;
  String? _imageUrl; // For editing existing group image

  @override
  void initState() {
    super.initState();
    if (widget.groupId != null) _loadGroup();
  }

  Future<void> _loadGroup() async {
    setState(() {
      _loading = true;
    });
    try {
      final details = await ContributionService().getGroupDetails(widget.groupId!);
      final group = details['group'];
      _nameCtrl.text = group['name'] ?? '';
      _amtCtrl.text = group['amountPerMember']?.toString() ?? '';
      _maxCtrl.text = group['maxMembers']?.toString() ?? '';
      _descCtrl.text = group['description'] ?? '';
      _frequency = group['frequency'] ?? 'Weekly';
      _schedule = group['payoutSchedule'] ?? 'Cycle End';
      _isPublic = group['isPublic'] ?? false;
      _imageUrl = group['imageUrl'];
    } catch (e) {
      setState(() {
        _error = 'Failed to load group details: ${e.toString()}';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() {
        _imageFile = File(picked.path);
        _imageUrl = null; // Clear old image if new one picked
      });
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = {
        'name': _nameCtrl.text,
        'amountPerMember': double.tryParse(_amtCtrl.text) ?? 0,
        'maxMembers': int.tryParse(_maxCtrl.text) ?? 0,
        'frequency': _frequency,
        'payoutSchedule': _schedule,
        'description': _descCtrl.text,
        'isPublic': _isPublic,
      };
      if (widget.groupId == null) {
        await ContributionService().createGroup(data, imagePath: _imageFile?.path);
      } else {
        await ContributionService().updateGroup(widget.groupId!, data, imagePath: _imageFile?.path);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _amtCtrl.dispose();
    _maxCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.groupId == null ? 'Create Group' : 'Edit Group';
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _form,
                child: ListView(
                  children: [
                    if (_imageFile != null)
                      Semantics(
                        label: 'Selected group image',
                        child: Image.file(_imageFile!, height: 120, fit: BoxFit.cover),
                      )
                    else if (_imageUrl != null)
                      Semantics(
                        label: 'Group image',
                        child: Image.network(_imageUrl!, height: 120, fit: BoxFit.cover),
                      ),
                    TextButton.icon(
                      icon: const Icon(Icons.image),
                      label: const Text('Select Group Image'),
                      onPressed: _pickImage,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(labelText: 'Group Name'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _amtCtrl,
                      decoration: const InputDecoration(labelText: 'Amount per Member'),
                      keyboardType: TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        final value = double.tryParse(v);
                        if (value == null || value <= 0) return 'Enter a valid amount';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _maxCtrl,
                      decoration: const InputDecoration(labelText: 'Max Members'),
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        final value = int.tryParse(v);
                        if (value == null || value <= 0) return 'Enter a valid number';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descCtrl,
                      decoration: const InputDecoration(labelText: 'Description (optional)'),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _frequency,
                      decoration: const InputDecoration(labelText: 'Frequency'),
                      items: ['Daily', 'Weekly', 'Monthly']
                          .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                          .toList(),
                      onChanged: (v) => setState(() {
                        _frequency = v!;
                      }),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _schedule,
                      decoration: const InputDecoration(labelText: 'Payout Schedule'),
                      items: ['Cycle End', 'Fixed Date']
                          .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                          .toList(),
                      onChanged: (v) => setState(() {
                        _schedule = v!;
                      }),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      value: _isPublic,
                      onChanged: (v) => setState(() {
                        _isPublic = v;
                      }),
                      title: const Text('Public Group'),
                    ),
                    const SizedBox(height: 24),
                    if (_error != null)
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _loading ? null : () => Navigator.pop(context),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _loading ? null : _save,
                            child: _loading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Text('Save'),
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ),
      ),
    );
  }
}