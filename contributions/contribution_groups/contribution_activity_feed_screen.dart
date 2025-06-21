import 'package:flutter/material.dart';

class ContributionActivityFeedScreen extends StatelessWidget {
  const ContributionActivityFeedScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Timeline of group/cycle activities
    return Scaffold(
      appBar: AppBar(title: const Text('Activity Feed')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          ListTile(
            leading: Icon(Icons.group_add),
            title: Text('John joined the group'),
            subtitle: Text('2 hours ago'),
          ),
          ListTile(
            leading: Icon(Icons.payment),
            title: Text('Jane made a contribution'),
            subtitle: Text('Today, 10:00 AM'),
          ),
          ListTile(
            leading: Icon(Icons.check_circle),
            title: Text('Cycle #2 completed'),
            subtitle: Text('Yesterday'),
          ),
        ],
      ),
    );
  }
}