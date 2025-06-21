import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api.dart';

class ContributionCycleService {
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

  Future<List<dynamic>> getAllCycles() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.getCycles),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = await _handleResponse(response);
    return data is List ? data : (data['cycles'] ?? []);
  }

  Future<Map<String, dynamic>?> getCycleById(int id) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse(Api.getCycleById(id)),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Failed to fetch cycle');
    }
  }

  Future<Map<String, dynamic>> createCycle({
    required int groupId,
    required String startDate,
    required String endDate,
    String payoutOrderType = 'rotational',
    double? amount,
  }) async {
    final token = await _getToken();
    final body = {
      'groupId': groupId,
      'startDate': startDate,
      'endDate': endDate,
      'payoutOrderType': payoutOrderType,
      if (amount != null) 'amount': amount,
    };
    final response = await http.post(
      Uri.parse(Api.createCycle),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );
    return await _handleResponse(response);
  }

  Future<Map<String, dynamic>> makeContribution(int cycleId, double amount, {String? txRef}) async {
    final token = await _getToken();
    final body = {
      'cycleId': cycleId,
      'amount': amount,
      if (txRef != null) 'txRef': txRef,
    };
    final response = await http.post(
      Uri.parse(Api.makeContribution(cycleId)),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );
    return await _handleResponse(response);
  }
  Future<List<dynamic>> getCyclePayments(int cycleId) async {
  final token = await _getToken();
  final response = await http.get(
    Uri.parse(Api.cyclePayments(cycleId)),
    headers: {'Authorization': 'Bearer $token'},
  );
  if (response.statusCode >= 400) {
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? data['message'] ?? 'Failed to load payments');
  }
  final data = jsonDecode(response.body);
  return data['payments'] ?? [];
}

  Future<Map<String, dynamic>> closeCycle(int cycleId) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse(Api.closeCycle(cycleId)),
      headers: {'Authorization': 'Bearer $token'},
    );
    return await _handleResponse(response);
  }
  Future<List<dynamic>> getGroupCycles(int groupId) async {
  final token = await _getToken();
  final response = await http.get(
    Uri.parse('${Api.contributionCycles}?groupId=$groupId'),
    headers: {'Authorization': 'Bearer $token'},
  );
  if (response.statusCode >= 400) {
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? data['message'] ?? 'Failed to load cycles');
  }
  final data = jsonDecode(response.body);
  // Adjust this if your backend returns { cycles: [...] }
  return data['cycles'] ?? data ?? [];
}
}