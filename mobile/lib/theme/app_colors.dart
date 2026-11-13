import 'package:flutter/material.dart';

class AppColors {
  // Web Brand Primary (Vibrant Ethiopian Mint / Emerald from Web App: #00D287 / #0D9668)
  static const Color primary = Color(0xFF00D287);
  static const Color primaryDark = Color(0xFF0D9668);
  static const Color primaryDeep = Color(0xFF073228);
  static const Color primaryLight = Color(0xFFE6FBF2);
  static const Color primaryLightDarkTheme = Color(0xFF073228);

  // Secondary Accent (Corporate Blue from Web App)
  static const Color secondary = Color(0xFF2563EB);
  static const Color secondaryDark = Color(0xFF1D4ED8);
  static const Color secondaryLight = Color(0xFFEFF6FF);

  // Iconic Web Petrol Dark / Navy Theme (Matches src/components/layout/app-sidebar.tsx & globals.css)
  static const Color brandNavy = Color(0xFF071924);
  static const Color brandNavySurface = Color(0xFF06161F);
  static const Color brandNavyCard = Color(0xFF0E2736);
  static const Color brandNavyBorder = Color(0xFF184257);
  static const Color brandNavyHover = Color(0xFF113144);

  // Light Mode Palette (Matches Web App: #F8FAFC body, #FFFFFF cards, #E2E8F0 borders)
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightTextMuted = Color(0xFF94A3B8);

  // Dark Mode Palette (Matches Web App: #070e17 body, #0d1829 card, #1a2a40 border)
  static const Color darkBg = Color(0xFF070E17);
  static const Color darkSurface = Color(0xFF0D1829);
  static const Color darkCard = Color(0xFF0E2736);
  static const Color darkBorder = Color(0xFF1A2A40);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextMuted = Color(0xFF64748B);

  // Semantic Colors
  static const Color success = Color(0xFF00D287);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Ethiopian Payment Providers (Telebirr, CBE Birr, Cash)
  static const Color telebirr = Color(0xFF0091FF);
  static const Color cbeBirr = Color(0xFF6B1D73);
  static const Color cash = Color(0xFF00D287);
}
