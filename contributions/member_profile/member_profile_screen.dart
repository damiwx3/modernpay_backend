import 'package:flutter/material.dart';

class MemberProfileScreen extends StatelessWidget {
  final int memberId;
  const MemberProfileScreen({Key? key, required this.memberId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Show member's profile, contributions, and history
    return Scaffold(
      appBar: AppBar(title: const Text('Member Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 40,
              child: Icon(Icons.person, size: 40),
            ),
            const SizedBox(height: 16),
            Text('Member ID: $memberId', style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 16),
            const ListTile(
              leading: Icon(Icons.email),
              title: Text('Email'),
              subtitle: Text('user@email.com'),
            ),
            const Divider(),
            const ListTile(
              leading: Icon(Icons.history),
              title: Text('Contribution History'),
              subtitle: Text('View all contributions by this member'),
            ),
          ],
        ),
      ),
    );
  }
}