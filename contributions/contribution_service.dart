import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api.dart';

class ContributionService {
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }

  // Helper for error handling
  Future<T> _handleResponse<T>(http.Response response) async {
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Request failed');
    }
    return data;
  }

  // Create Group
  Future<Map<String, dynamic>> createGroup(Map<String, dynamic> data, {String? imagePath}) async {
    final token = await _getToken();
    var request = http.MultipartRequest('POST', Uri.parse(Api.contributionGroups));
    request.headers['Authorization'] = 'Bearer $token';
    data.forEach((key, value) => request.fields[key] = value.toString());
    if (imagePath != null) {
      request.files.add(await http.MultipartFile.fromPath('image', imagePath));
    }
    final streamed = await request.send();
    final resp = await http.Response.fromStream(streamed);
    if (resp.statusCode >= 400) {
      final data = jsonDecode(resp.body);
      throw Exception(data['message'] ?? 'Request failed');
    }
    return jsonDecode(resp.body);
  }

  // Update Group (now supports imagePath)
  Future<Map<String, dynamic>> updateGroup(int groupId, Map<String, dynamic> data, {String? imagePath}) async {
    final token = await _getToken();
    if (imagePath != null) {
      // Use multipart request if updating image
      var request = http.MultipartRequest('PUT', Uri.parse(Api.updateGroup(groupId)));
      request.headers['Authorization'] = 'Bearer $token';
      data.forEach((key, value) => request.fields[key] = value.toString());
      request.files.add(await http.MultipartFile.fromPath('image', imagePath));
      final streamed = await request.send();
      final resp = await http.Response.fromStream(streamed);
      if (resp.statusCode >= 400) {
        final data = jsonDecode(resp.body);
        throw Exception(data['message'] ?? 'Request failed');
      }
      return jsonDecode(resp.body);
    } else {
      // Use normal PUT if no image
      final response = await http.put(
        Uri.parse(Api.updateGroup(groupId)),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      );
      if (response.statusCode >= 400) {
        final data = jsonDecode(response.body);
        throw Exception(data['message'] ?? 'Request failed');
      }
      return jsonDecode(response.body);
    }
  }

  // Get All Groups
  Future<List<dynamic>> getGroups() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.contributionGroups),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = await _handleResponse(response);
    return data is List ? data : (data['groups'] ?? []);
  }

  // Join Group by groupId
  Future<Map<String, dynamic>> joinGroup(int groupId) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse(Api.joinGroup(groupId)),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    return await _handleResponse(response);
  }

  // Leave Group
  Future<Map<String, dynamic>> leaveGroup(int groupId) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse(Api.leaveGroup(groupId)),
      headers: {'Authorization': 'Bearer $token'},
    );
    return await _handleResponse(response);
  }

  // Get Group Members
  Future<List<dynamic>> getGroupMembers(int groupId) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.groupMembers(groupId)),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = await _handleResponse(response);
    return data['members'] ?? [];
  }

  // Add Contact
  Future<Map<String, dynamic>> addContact(int contactUserId) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse(Api.addContributionContact),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'contactUserId': contactUserId}),
    );
    return await _handleResponse(response);
  }

  // Run Scheduler
  Future<Map<String, dynamic>> runScheduler() async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse(Api.runContributionScheduler),
      headers: {'Authorization': 'Bearer $token'},
    );
    return await _handleResponse(response);
  }

  // Send Group Invite by Email
  Future<void> sendGroupInviteByEmail(int groupId, String email) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse(Api.inviteToGroup(groupId)),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'email': email}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to send invite');
    }
  }

  // Get Missed Contributions
  Future<List<Map<String, dynamic>>> getMissedContributions({int? groupId}) async {
    final token = await _getToken();
    final uri = Uri.parse(Api.missedContributions)
        .replace(queryParameters: groupId != null ? {'groupId': groupId.toString()} : null);
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? data['message'] ?? 'Failed to load missed contributions');
    }
    return (data['missedContributions'] as List)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  }

  // Get Contribution Summary
  Future<Map<String, dynamic>> getContributionSummary() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.contributionSummary),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? data['message'] ?? 'Failed to load summary');
    }
    return data;
  }

  // Get Group Cycles
  Future<List<dynamic>> getGroupCycles(int groupId) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.groupCycles(groupId)),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = await _handleResponse(response);
    return data['cycles'] ?? [];
  }

  // Get current logged-in user ID
  Future<int?> getCurrentUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('userId');
  }

  // Get Group Details
  Future<Map<String, dynamic>> getGroupDetails(int groupId) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.groupDetails(groupId)),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? data['message'] ?? 'Failed to load group details');
    }
    return data;
  }
}