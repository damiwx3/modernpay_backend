import 'package:flutter/material.dart';

class ContributionDisputesScreen extends StatelessWidget {
  const ContributionDisputesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Raise and track disputes or support tickets
    return Scaffold(
      appBar: AppBar(title: const Text('Contribution Disputes')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ElevatedButton.icon(
            icon: const Icon(Icons.report_problem),
            label: const Text('Raise a Dispute'),
            onPressed: () {},
          ),
          const SizedBox(height: 24),
          const ListTile(
            leading: Icon(Icons.report),
            title: Text('Dispute #123'),
            subtitle: Text('Status: Open\nReason: Missed payout'),
          ),
          const ListTile(
            leading: Icon(Icons.report),
            title: Text('Dispute #122'),
            subtitle: Text('Status: Resolved\nReason: Incorrect amount'),
          ),
        ],
      ),
    );
  }
}