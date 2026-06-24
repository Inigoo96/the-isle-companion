package com.theisle.companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theisle.companion.domain.entity.Dino;
import com.theisle.companion.domain.entity.DinoGrowthStage;
import com.theisle.companion.domain.entity.DinoMutation;
import com.theisle.companion.domain.entity.DinoStat;
import com.theisle.companion.domain.entity.Mutation;
import com.theisle.companion.domain.entity.PrimeTask;
import com.theisle.companion.domain.entity.Zone;
import com.theisle.companion.domain.entity.id.DinoGrowthStageId;
import com.theisle.companion.domain.entity.id.DinoMutationId;
import com.theisle.companion.domain.entity.id.DinoStatId;
import com.theisle.companion.domain.enums.DinoDict;
import com.theisle.companion.domain.enums.DinoTier;
import com.theisle.companion.domain.enums.GrowthStage;
import com.theisle.companion.domain.enums.MutationCategory;
import com.theisle.companion.domain.enums.PrimeTaskCategory;
import com.theisle.companion.domain.enums.RecommendationTag;
import com.theisle.companion.domain.enums.StatStage;
import com.theisle.companion.domain.enums.ZoneCategory;
import com.theisle.companion.domain.enums.ZoneShape;
import com.theisle.companion.domain.repository.DinoGrowthStageRepository;
import com.theisle.companion.domain.repository.DinoMutationRepository;
import com.theisle.companion.domain.repository.DinoRepository;
import com.theisle.companion.domain.repository.DinoStatRepository;
import com.theisle.companion.domain.repository.MutationRepository;
import com.theisle.companion.domain.repository.PrimeTaskRepository;
import com.theisle.companion.domain.repository.ZoneRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
public class CatalogSeeder implements ApplicationRunner {

    private final MutationRepository mutationRepo;
    private final DinoRepository dinoRepo;
    private final DinoStatRepository dinoStatRepo;
    private final DinoGrowthStageRepository dinoGrowthStageRepo;
    private final DinoMutationRepository dinoMutationRepo;
    private final ZoneRepository zoneRepo;
    private final PrimeTaskRepository primeTaskRepo;
    private final ObjectMapper mapper;

    public CatalogSeeder(MutationRepository mutationRepo,
                         DinoRepository dinoRepo,
                         DinoStatRepository dinoStatRepo,
                         DinoGrowthStageRepository dinoGrowthStageRepo,
                         DinoMutationRepository dinoMutationRepo,
                         ZoneRepository zoneRepo,
                         PrimeTaskRepository primeTaskRepo,
                         ObjectMapper mapper) {
        this.mutationRepo = mutationRepo;
        this.dinoRepo = dinoRepo;
        this.dinoStatRepo = dinoStatRepo;
        this.dinoGrowthStageRepo = dinoGrowthStageRepo;
        this.dinoMutationRepo = dinoMutationRepo;
        this.zoneRepo = zoneRepo;
        this.primeTaskRepo = primeTaskRepo;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        Map<String, Mutation> mutationsByName = seedMutations();
        seedDinos(mutationsByName);
        seedZones();
        seedPrimeTasks();
    }

    private Map<String, Mutation> seedMutations() throws Exception {
        Map<String, Mutation> result = new HashMap<>();

        if (mutationRepo.count() > 0) {
            mutationRepo.findAll().forEach(m -> result.put(m.getName(), m));
            return result;
        }

        JsonNode root = mapper.readTree(new ClassPathResource("seed/mutations.json").getInputStream());
        root.fields().forEachRemaining(entry -> {
            String name = entry.getKey();
            JsonNode data = entry.getValue();

            Mutation m = new Mutation();
            m.setName(name);
            m.setEffect(data.get("effect").asText());
            m.setCategory(MutationCategory.valueOf(data.get("category").asText().toUpperCase()));

            Mutation saved = mutationRepo.save(m);
            result.put(saved.getName(), saved);
        });

        return result;
    }

    private void seedDinos(Map<String, Mutation> mutationsByName) throws Exception {
        if (dinoRepo.count() > 0) return;

        JsonNode root = mapper.readTree(new ClassPathResource("seed/dinos.json").getInputStream());

        String[] groups = {"carnivores", "herbivores", "omnivores"};
        for (String group : groups) {
            JsonNode list = root.get(group);
            if (list == null) continue;

            for (JsonNode dinoNode : list) {
                Dino dino = new Dino();
                dino.setName(dinoNode.get("name").asText());
                dino.setDiet(DinoDict.valueOf(dinoNode.get("diet").asText().toUpperCase()));
                dino.setTier(parseTier(dinoNode.get("tier").asText()));
                if (dinoNode.has("ability")) {
                    dino.setAbility(dinoNode.get("ability").asText());
                }

                Dino saved = dinoRepo.save(dino);
                int dinoId = saved.getId();

                // stats
                JsonNode stats = dinoNode.get("stats");
                for (StatStage stage : StatStage.values()) {
                    JsonNode stageName = stats.get(stage.name().toLowerCase());
                    if (stageName == null) continue;

                    DinoStat stat = new DinoStat();
                    stat.setId(new DinoStatId(dinoId, stage));
                    stat.setDino(saved);
                    stat.setWeight(BigDecimal.valueOf(stageName.get("weight").asDouble()));
                    stat.setSpeed(BigDecimal.valueOf(stageName.get("speed").asDouble()));
                    stat.setBiteForce(BigDecimal.valueOf(stageName.get("biteForce").asDouble()));
                    dinoStatRepo.save(stat);
                }

                // growth stages
                JsonNode growthStages = dinoNode.path("growthData").path("stages");
                short ordinal = 0;
                for (JsonNode stageNode : growthStages) {
                    GrowthStage growthStage = parseGrowthStage(stageNode.get("name").asText());

                    DinoGrowthStage dgs = new DinoGrowthStage();
                    dgs.setId(new DinoGrowthStageId(dinoId, growthStage));
                    dgs.setDino(saved);
                    dgs.setOrdinal(ordinal++);
                    dgs.setMinutes(stageNode.get("minutes").asInt());
                    dinoGrowthStageRepo.save(dgs);
                }

                // recommended mutations
                JsonNode recs = dinoNode.get("recommendedMutations");
                if (recs != null) {
                    short priority = 1;
                    for (JsonNode rec : recs) {
                        String mutName = rec.get("name").asText();
                        Mutation mutation = mutationsByName.get(mutName);
                        if (mutation == null) continue;

                        RecommendationTag tag = parseTag(rec.get("tags"));

                        DinoMutation dm = new DinoMutation();
                        dm.setId(new DinoMutationId(dinoId, mutation.getId()));
                        dm.setDino(saved);
                        dm.setMutation(mutation);
                        dm.setPriority(priority++);
                        dm.setTag(tag);
                        dinoMutationRepo.save(dm);
                    }
                }
            }
        }
    }

    private void seedZones() throws Exception {
        if (zoneRepo.count() > 0) return;

        JsonNode root = mapper.readTree(new ClassPathResource("seed/zones.json").getInputStream());

        saveZoneGroup(root.get("patrolZones"), ZoneCategory.PATROL);
        saveZoneGroup(root.get("migrationZones"), ZoneCategory.MIGRATION);
        saveZoneGroup(root.get("sanctuaries"), ZoneCategory.SANCTUARY);
    }

    private void saveZoneGroup(JsonNode list, ZoneCategory category) throws Exception {
        if (list == null) return;
        for (JsonNode node : list) {
            Zone zone = new Zone();
            zone.setName(node.get("name").asText());
            zone.setCategory(category);

            String type = node.get("type").asText();
            zone.setShape(type.equals("circle") ? ZoneShape.CIRCLE : ZoneShape.POLYGON);
            zone.setGeometry(mapper.writeValueAsString(node));
            zoneRepo.save(zone);
        }
    }

    private void seedPrimeTasks() {
        if (primeTaskRepo.count() > 0) return;

        Object[][] tasks = {
            { "no-spasms",       "Never Muscle Spasms",       PrimeTaskCategory.DEFAULT,        true,  (short) 1 },
            { "no-infertile",    "Never Infertile",           PrimeTaskCategory.DEFAULT,        true,  (short) 2 },
            { "perfect-diet",    "Perfect Diet",              PrimeTaskCategory.DIET_BIRTH,     false, (short) 3 },
            { "born-egg",        "Born from an Egg",          PrimeTaskCategory.DIET_BIRTH,     false, (short) 4 },
            { "visit-sanc",      "Visit a Sanctuary",         PrimeTaskCategory.EXPLORATION,    false, (short) 5 },
            { "visit-2mz",       "Visit 2 Migration Zones",   PrimeTaskCategory.EXPLORATION,    false, (short) 6 },
            { "visit-4pz",       "Visit 4 Patrol Zones",      PrimeTaskCategory.EXPLORATION,    false, (short) 7 },
            { "visit-mmz",       "Visit the MMZ",             PrimeTaskCategory.EXPLORATION,    false, (short) 8 },
            { "raise-baby",      "Raise a Baby",              PrimeTaskCategory.BREEDING,       false, (short) 9 },
            { "special-species", "Playing a Special Species", PrimeTaskCategory.SPECIAL_SPECIES,false, (short) 10 },
        };

        for (Object[] row : tasks) {
            PrimeTask task = new PrimeTask();
            task.setKey((String) row[0]);
            task.setName((String) row[1]);
            task.setCategory((PrimeTaskCategory) row[2]);
            task.setDefaultActive((Boolean) row[3]);
            task.setSortOrder((Short) row[4]);
            primeTaskRepo.save(task);
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static DinoTier parseTier(String raw) {
        return switch (raw) {
            case "Apex"    -> DinoTier.APEX;
            case "High"    -> DinoTier.HIGH;
            case "Mid"     -> DinoTier.MID;
            case "Low-Mid" -> DinoTier.LOW_MID;
            case "Low"     -> DinoTier.LOW;
            default        -> throw new IllegalArgumentException("Unknown tier: " + raw);
        };
    }

    private static GrowthStage parseGrowthStage(String raw) {
        return switch (raw) {
            case "Hatchling" -> GrowthStage.HATCHLING;
            case "Juvenile"  -> GrowthStage.JUVENILE;
            case "Sub-Adult" -> GrowthStage.SUB_ADULT;
            case "Elder"     -> GrowthStage.ELDER;
            default          -> throw new IllegalArgumentException("Unknown growth stage: " + raw);
        };
    }

    private static RecommendationTag parseTag(JsonNode tagsArray) {
        if (tagsArray == null || tagsArray.isEmpty()) return null;
        return switch (tagsArray.get(0).asText()) {
            case "s2"   -> RecommendationTag.SLOT2;
            case "desb" -> RecommendationTag.UNLOCKABLE;
            case "situ" -> RecommendationTag.SITUATIONAL;
            default     -> null;
        };
    }
}
