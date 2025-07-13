package com.spiltwise.controller;

import com.spiltwise.model.Entry;
import com.spiltwise.model.Split;
import com.spiltwise.model.User;
import com.spiltwise.repository.EntryRepository;
import com.spiltwise.service.SplitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"https://api.splitwise.world", "http://localhost:3000", "https://splitwise.world", "http://freesplitewisefrontend.s3-website.us-east-2.amazonaws.com", "https://pheasant-lucky-owl.ngrok-free.app"})
@RestController
@RequestMapping("/api/splits")
public class SplitController {

    @Autowired
    private SplitService splitService;

    @Autowired
    private EntryRepository entryRepository;

    /**
     * Create equal splits for an entry
     * POST /api/splits/equal
     */
    @PostMapping("/equal")
    public ResponseEntity<?> createEqualSplits(@RequestBody Map<String, Object> request) {
        try {
            String entryId = (String) request.get("entryId");
            List<String> userIds = (List<String>) request.get("userIds");
            double totalAmount = ((Number) request.get("totalAmount")).doubleValue();

            Entry entry = entryRepository.findById(entryId).orElseThrow(() -> 
                new RuntimeException("Entry not found"));

            List<Split> splits = splitService.createEqualSplits(userIds, totalAmount);
            entry.setSplits(splits);
            entry.setSplitType("EQUAL");
            entry.setAmount(totalAmount);

            Entry savedEntry = entryRepository.save(entry);
            return ResponseEntity.ok(savedEntry);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    /**
     * Create percentage-based splits for an entry
     * POST /api/splits/percentage
     */
    @PostMapping("/percentage")
    public ResponseEntity<?> createPercentageSplits(@RequestBody Map<String, Object> request) {
        try {
            String entryId = (String) request.get("entryId");
            List<String> userIds = (List<String>) request.get("userIds");
            List<Double> percentages = (List<Double>) request.get("percentages");
            double totalAmount = ((Number) request.get("totalAmount")).doubleValue();

            Entry entry = entryRepository.findById(entryId).orElseThrow(() -> 
                new RuntimeException("Entry not found"));

            List<Split> splits = splitService.createPercentageSplits(userIds, percentages, totalAmount);
            entry.setSplits(splits);
            entry.setSplitType("PERCENTAGE");
            entry.setAmount(totalAmount);

            Entry savedEntry = entryRepository.save(entry);
            return ResponseEntity.ok(savedEntry);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    /**
     * Create manual splits for an entry
     * POST /api/splits/manual
     */
    @PostMapping("/manual")
    public ResponseEntity<?> createManualSplits(@RequestBody Map<String, Object> request) {
        try {
            String entryId = (String) request.get("entryId");
            List<String> userIds = (List<String>) request.get("userIds");
            List<Double> amounts = (List<Double>) request.get("amounts");

            Entry entry = entryRepository.findById(entryId).orElseThrow(() -> 
                new RuntimeException("Entry not found"));

            List<Split> splits = splitService.createManualSplits(userIds, amounts);
            entry.setSplits(splits);
            entry.setSplitType("MANUAL");
            
            // Calculate total amount from splits
            double totalAmount = amounts.stream().mapToDouble(Double::doubleValue).sum();
            entry.setAmount(totalAmount);

            Entry savedEntry = entryRepository.save(entry);
            return ResponseEntity.ok(savedEntry);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    /**
     * Mark a split as paid
     * POST /api/splits/pay
     */
    @PostMapping("/pay")
    public ResponseEntity<?> markSplitAsPaid(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("=== MARK AS PAID REQUEST ===");
            System.out.println("Request body: " + request);
            
            String entryId = (String) request.get("entryId");
            String userId = (String) request.get("userId");
            String paidDate = (String) request.get("paidDate");
            
            System.out.println("Entry ID: " + entryId);
            System.out.println("User ID: " + userId);
            System.out.println("Paid Date: " + paidDate);

            Entry entry = entryRepository.findById(entryId).orElseThrow(() -> 
                new RuntimeException("Entry not found"));
            
            System.out.println("Entry found: " + entry.getTitle());
            System.out.println("Entry splits before: " + entry.getSplits());

            // Use the SplitService to mark as paid with the provided date
            splitService.markSplitAsPaid(entry, userId, paidDate != null ? paidDate : LocalDateTime.now().toString());

            Entry savedEntry = entryRepository.save(entry);
            
            System.out.println("Entry splits after: " + savedEntry.getSplits());
            System.out.println("=== MARK AS PAID COMPLETE ===");
            
            return ResponseEntity.ok(savedEntry);
        } catch (Exception e) {
            System.err.println("Error in markSplitAsPaid: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    /**
     * Get user's balance across all entries in a group
     * GET /api/splits/balance?groupId=xxx&userId=xxx
     */
    @GetMapping("/balance")
    public ResponseEntity<?> getUserBalance(@RequestParam String groupId, @RequestParam String userId) {
        try {
            List<Entry> entries = entryRepository.findByGroupId(groupId).orElseThrow(() -> 
                new RuntimeException("Group not found"));

            double balance = splitService.calculateUserBalance(entries, userId);
            return ResponseEntity.ok(Map.of("userId", userId, "balance", balance));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    /**
     * Get all unpaid splits for a user in a group
     * GET /api/splits/unpaid?groupId=xxx&userId=xxx
     */
    @GetMapping("/unpaid")
    public ResponseEntity<?> getUnpaidSplits(@RequestParam String groupId, @RequestParam String userId) {
        try {
            List<Entry> entries = entryRepository.findByGroupId(groupId).orElseThrow(() -> 
                new RuntimeException("Group not found"));

            List<Split> unpaidSplits = splitService.getUnpaidSplitsForUser(entries, userId);
            return ResponseEntity.ok(unpaidSplits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }

    /**
     * Get current user's balance across all entries in a group
     * GET /api/splits/my-balance?groupId=xxx
     */
    @GetMapping("/my-balance")
    public ResponseEntity<?> getMyBalance(@RequestParam String groupId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();

            List<Entry> entries = entryRepository.findByGroupId(groupId).orElseThrow(() -> 
                new RuntimeException("Group not found"));

            double balance = splitService.calculateUserBalance(entries, userId);
            return ResponseEntity.ok(Map.of("userId", userId, "balance", balance, "userInfo", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        }
    }
} 