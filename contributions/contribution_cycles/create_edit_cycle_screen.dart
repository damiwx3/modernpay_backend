import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../services/contribution_cycle_service.dart';

class CreateEditCycleScreen extends StatefulWidget {
  final int groupId;
  final int? cycleId;
  const CreateEditCycleScreen({Key? key, required this.groupId, this.cycleId}) : super(key: key);

  @override
  State<CreateEditCycleScreen> createState() => _CreateEditCycleScreenState();
}

class _CreateEditCycleScreenState extends State<CreateEditCycleScreen> {
  final _form = GlobalKey<FormState>();
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  final _amtCtrl = TextEditingController();
  String _orderType = 'random';
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _startCtrl.dispose();
    _endCtrl.dispose();
    _amtCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2022),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      ctrl.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ContributionCycleService().createCycle(
        groupId: widget.groupId,
        startDate: _startCtrl.text,
        endDate: _endCtrl.text,
        amount: double.parse(_amtCtrl.text),
        payoutOrderType: _orderType,
      );
      Navigator.pop(context, true);
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.cycleId == null ? 'Create Cycle' : 'Edit Cycle';
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
                    TextFormField(
                      controller: _startCtrl,
                      decoration: InputDecoration(
                        labelText: 'Start Date (YYYY-MM-DD)',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.calendar_today),
                          onPressed: () => _pickDate(_startCtrl),
                        ),
                      ),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                      readOnly: true,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _endCtrl,
                      decoration: InputDecoration(
                        labelText: 'End Date (YYYY-MM-DD)',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.calendar_today),
                          onPressed: () => _pickDate(_endCtrl),
                        ),
                      ),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                      readOnly: true,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _amtCtrl,
                      decoration: const InputDecoration(labelText: 'Contribution Amount'),
                      keyboardType: TextInputType.numberWithOptions(decimal: true),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _orderType,
                      decoration: const InputDecoration(labelText: 'Payout Order Type'),
                      items: ['random', 'rotational']
                          .map((o) => DropdownMenuItem(value: o, child: Text(o.capitalize())))
                          .toList(),
                      onChanged: (v) => setState(() {
                        _orderType = v!;
                      }),
                    ),
                    const SizedBox(height: 24),
                    if (_error != null)
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _save,
                            child: const Text('Save'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

extension on String {
  String capitalize() => substring(0, 1).toUpperCase() + substring(1);
}