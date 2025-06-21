import 'package:flutter/material.dart';

class ContributionSettingsScreen extends StatelessWidget {
  const ContributionSettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Settings for notifications, auto-pay, reminders, etc.
    return Scaffold(
      appBar: AppBar(title: const Text('Contribution Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            value: true,
            onChanged: (v) {},
            title: const Text('Enable Notifications'),
          ),
          SwitchListTile(
            value: false,
            onChanged: (v) {},
            title: const Text('Enable Auto-Pay'),
          ),
          ListTile(
            title: const Text('Reminder Frequency'),
            subtitle: const Text('Weekly'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          const Divider(),
          ListTile(
            title: const Text('Contribution Policy'),
            subtitle: const Text('View group/cycle policy'),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}