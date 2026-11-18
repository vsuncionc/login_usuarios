package com.empresa.seguridad.domain.repository;

import com.empresa.seguridad.domain.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    Optional<Permission> findByCode(String code);

    Set<Permission> findByCodeIn(Collection<String> codes);

    List<Permission> findByResource(String resource);
}
