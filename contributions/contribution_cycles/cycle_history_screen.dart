import 'package:flutter/material.dart';

class CycleHistoryScreen extends StatelessWidget {
  const CycleHistoryScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Archive of completed cycles
    return Scaffold(
      appBar: AppBar(title: const Text('Cycle History')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          ListTile(
            leading: Icon(Icons.history),
            title: Text('Cycle #1'),
            subtitle: Text('Completed on 2024-01-15'),
          ),
          ListTile(
            leading: Icon(Icons.history),
            title: Text('Cycle #2'),
            subtitle: Text('Completed on 2024-02-15'),
          ),
        ],
      ),
    );
  }
}