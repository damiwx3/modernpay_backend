import 'package:flutter/material.dart';

class ContributionNotificationsScreen extends StatelessWidget {
  const ContributionNotificationsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // List of notifications related to contributions
    return Scaffold(
      appBar: AppBar(title: const Text('Contribution Notifications')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          ListTile(
            leading: Icon(Icons.notifications),
            title: Text('Payment Reminder'),
            subtitle: Text('You have a pending contribution for Cycle #3.'),
          ),
          ListTile(
            leading: Icon(Icons.notifications_active),
            title: Text('Payout Received'),
            subtitle: Text('You received a payout for Cycle #2.'),
          ),
          ListTile(
            leading: Icon(Icons.warning),
            title: Text('Missed Contribution'),
            subtitle: Text('You missed a payment for Cycle #1.'),
          ),
        ],
      ),
    );
  }
}