package com.spiltwise.controller;

import com.spiltwise.model.Group;
import com.spiltwise.model.User;
import com.spiltwise.repository.GroupRepository;
import com.spiltwise.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = {"https://api.splitwise.world", "http://localhost:3000", "https://splitwise.world", "http://freesplitewisefrontend.s3-website.us-east-2.amazonaws.com", "https://pheasant-lucky-owl.ngrok-free.app"})
@RestController
@RequestMapping("/api/groups")
public class GroupController {
    
    private static final Logger log = LoggerFactory.getLogger(GroupController.class);
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @GetMapping("/all")
    public List<Group> getAllGroups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.isAuthenticated()) {
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();
            List<Group> groups = groupRepository.findByMemberIdsContaining(userId);
            log.info("Found {} groups for user {}", groups.size(), userId);
            return groups;
        }
        return List.of();
    }
    
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Group group) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();
            
            // Set the creator as owner and first member
            group.setOwnerId(userId);
            group.getMemberIds().add(userId);
            
            // If it's a private group, encode the password
            if (!group.isPublic() && group.getPassword() != null && !group.getPassword().isEmpty()) {
                log.info("Encoding password for private group: {}", group.getName());
                group.setPassword(passwordEncoder.encode(group.getPassword()));
            }
            
            Group savedGroup = groupRepository.save(group);
            log.info("Group created: {} by user {}", savedGroup.getName(), userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);
            
        } catch (Exception e) {
            log.error("Error creating group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating group: " + e.getMessage());
        }
    }
    
    @GetMapping("/search")
    public List<Group> searchGroups(@RequestParam String name) {
        log.info("Searching for groups with name containing: {}", name);
        return groupRepository.findByNameContainingIgnoreCase(name);
    }
    
    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(@RequestBody Map<String, String> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();
            String groupId = request.get("groupId");
            String password = request.get("password");
            
            log.info("Join group request - GroupId: {}, UserId: {}, Password provided: {}", 
                    groupId, userId, password != null && !password.isEmpty());
            log.info("Raw password value: '{}'", password);
            
            if (groupId == null || groupId.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Group ID is required");
            }
            
            Optional<Group> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Group not found");
            }
            
            Group group = groupOpt.get();
            
            // Check if user is already a member
            if (group.getMemberIds().contains(userId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User is already a member of this group");
            }
            
            // Check password for private groups
            if (!group.isPublic()) {
                if (password == null || password.isEmpty()) {
                    log.warn("Password required for private group but not provided");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password is required for private groups");
                }
                
                if (group.getPassword() == null || group.getPassword().isEmpty()) {
                    log.error("Group password is null or empty in database for group: {}", groupId);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Group password not set");
                }
                
                log.info("Checking password for group: {}", groupId);
                if (!passwordEncoder.matches(password, group.getPassword())) {
                    log.warn("Invalid password attempt for group: {} by user: {}", groupId, userId);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid password");
                }
            }
            
            // Add user to group
            group.getMemberIds().add(userId);
            groupRepository.save(group);
            
            log.info("User {} successfully joined group {}", userId, groupId);
            return ResponseEntity.ok("Successfully joined group");
            
        } catch (Exception e) {
            log.error("Error joining group: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error joining group: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupById(@PathVariable String id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();
            
            Optional<Group> groupOpt = groupRepository.findById(id);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Group not found");
            }
            
            Group group = groupOpt.get();
            
            // Check if user is a member
            if (!group.getMemberIds().contains(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }
            
            return ResponseEntity.ok(group);
            
        } catch (Exception e) {
            log.error("Error getting group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error getting group: " + e.getMessage());
        }
    }
    
    @PostMapping("/leave/{id}")
    public ResponseEntity<?> leaveGroup(@PathVariable String id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();
            
            Optional<Group> groupOpt = groupRepository.findById(id);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Group not found");
            }
            
            Group group = groupOpt.get();
            
            // Remove user from group
            group.getMemberIds().remove(userId);
            groupRepository.save(group);
            
            log.info("User {} left group {}", userId, id);
            return ResponseEntity.ok("Successfully left group");
            
        } catch (Exception e) {
            log.error("Error leaving group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error leaving group: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable String id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }
            
            User user = (User) authentication.getPrincipal();
            String userId = user.getId();
            
            Optional<Group> groupOpt = groupRepository.findById(id);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Group not found");
            }
            
            Group group = groupOpt.get();
            
            // Check if user is the owner
            if (!userId.equals(group.getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the group owner can delete the group");
            }
            
            groupRepository.deleteById(id);
            log.info("Group {} deleted by owner {}", id, userId);
            return ResponseEntity.ok("Group deleted successfully");
            
        } catch (Exception e) {
            log.error("Error deleting group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting group: " + e.getMessage());
        }
    }
} 