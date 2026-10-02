-- Emergency Overlord GameManager v8.0 - MASTER SYSTEM
-- Features: 911 Call Answering Pipeline (Must answer call before incident activates),
-- Queue Capacity Management based on Level & Cash Upgrades, Zero-duplication Incident Generator,
-- Full DataStore Persistence, Fleet Expansion (Helicopters), Dev Promo Codes, 7-Day Daily, Hourly Rewards
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local DS = game:GetService("DataStoreService")

local RE = RS:WaitForChild("RemoteEvents", 10)
local RF = RS:WaitForChild("RemoteFunctions", 10)

local playerStore
pcall(function() playerStore = DS:GetDataStore("EOData_v8") end)

-- ========================
-- REGIONAL CITIES DATA
-- ========================
local CITIES = {
	Downtown = {id = "Downtown", name = "Downtown Metro", pop = 450000, security = 75, happiness = 82, danger = 3, mx = 0.44, my = 0.42, col = Color3.fromRGB(74, 144, 217)},
	Westvale = {id = "Westvale", name = "Westvale Industrial", pop = 280000, security = 30, happiness = 60, danger = 5, mx = 0.16, my = 0.38, col = Color3.fromRGB(255, 60, 60)},
	NorthRidge = {id = "NorthRidge", name = "NorthRidge Hills", pop = 220000, security = 45, happiness = 58, danger = 3, mx = 0.38, my = 0.18, col = Color3.fromRGB(160, 80, 255)},
	Southgate = {id = "Southgate", name = "Southgate Harbor", pop = 190000, security = 55, happiness = 70, danger = 2, mx = 0.44, my = 0.74, col = Color3.fromRGB(40, 200, 90)},
	Oakhaven = {id = "Oakhaven", name = "Oakhaven Valley", pop = 160000, security = 40, happiness = 65, danger = 1, mx = 0.74, my = 0.38, col = Color3.fromRGB(220, 170, 30)},
}

-- ========================
-- FLEET UNITS (Includes Tactical Helicopters)
-- ========================
local UNITS = {
	{id = "P-101", name = "Crown Victoria Patrol", dept = "Police", status = "available", city = "Downtown", speed = 10, grade = 5, icon = "🚔", alias = "PATROL"},
	{id = "P-102", name = "Interceptor SUV", dept = "Police", status = "available", city = "Westvale", speed = 11, grade = 4, icon = "🚔", alias = "SUV_P"},
	{id = "P-103", name = "Highway Cruiser", dept = "Police", status = "available", city = "Southgate", speed = 12, grade = 3, icon = "🚔", alias = "CRUISER"},
	{id = "K9-01", name = "K9 Pursuit Unit", dept = "Police", status = "available", city = "Downtown", speed = 10, grade = 2, icon = "🐕", alias = "K9"},
	{id = "SGT-01", name = "Supervisor Cruiser", dept = "Police", status = "available", city = "Downtown", speed = 11, grade = 6, icon = "⭐", alias = "SERGEANT"},
	{id = "SWAT-01", name = "BearCat Armored", dept = "Police", status = "available", city = "Downtown", speed = 8, grade = 8, icon = "🛡️", alias = "SWAT"},
	{id = "SWAT-02", name = "Ghost-Cruiser Stealth", dept = "Police", status = "available", city = "NorthRidge", speed = 18, grade = 7, icon = "🏎️", alias = "GHOST"},
	{id = "H-01", name = "SkyWatch-01 Tactical Air", dept = "Police", status = "available", city = "Downtown", speed = 25, grade = 9, icon = "🚁", alias = "CHOPPER_PD"},
	
	{id = "E-201", name = "Pumper Engine 201", dept = "Fire", status = "available", city = "Downtown", speed = 9, grade = 4, icon = "🚒", alias = "ENGINE"},
	{id = "E-202", name = "Heavy Engine 202", dept = "Fire", status = "available", city = "Westvale", speed = 8, grade = 5, icon = "🚒", alias = "HEAVY_ENG"},
	{id = "E-203", name = "Striker-9 Crash Truck", dept = "Fire", status = "available", city = "Southgate", speed = 14, grade = 9, icon = "🚒", alias = "STRIKER"},
	{id = "L-201", name = "100ft Ladder Truck", dept = "Fire", status = "available", city = "Downtown", speed = 7, grade = 6, icon = "🪜", alias = "LADDER"},
	{id = "HZ-01", name = "HazMat Containment", dept = "Fire", status = "available", city = "Westvale", speed = 7, grade = 5, icon = "☣️", alias = "HAZMAT"},
	{id = "H-03", name = "FireStorm Water-Dropper", dept = "Fire", status = "available", city = "Westvale", speed = 22, grade = 8, icon = "🚁", alias = "CHOPPER_FIRE"},
	
	{id = "A-301", name = "Type III BLS Medic", dept = "EMS", status = "available", city = "Downtown", speed = 11, grade = 3, icon = "🚑", alias = "BLS"},
	{id = "A-302", name = "Advanced Cardiac ALS", dept = "EMS", status = "available", city = "Westvale", speed = 11, grade = 4, icon = "🚑", alias = "ALS"},
	{id = "A-303", name = "Rapid Response SUV", dept = "EMS", status = "available", city = "NorthRidge", speed = 13, grade = 3, icon = "🚑", alias = "RAPID_MED"},
	{id = "H-02", name = "Medevac-Air Trauma", dept = "EMS", status = "available", city = "Downtown", speed = 26, grade = 9, icon = "🚁", alias = "CHOPPER_EMS"},
	{id = "CMD-01", name = "Mobile Command Bus", dept = "Police", status = "available", city = "Downtown", speed = 9, grade = 10, icon = "🚐", alias = "COMMAND_BUS"},
}

-- ========================
-- PURCHASABLE VEHICLE CATALOG
-- ========================
local PURCHASABLE_VEHICLES = {
	["H-01"] = {id = "H-01", name = "SkyWatch-01 Tactical Air", dept = "Police", icon = "🚁", cost = 75000, speed = 25, grade = 9, desc = "Aerial Pursuit & City-Wide Surveillance"},
	["H-02"] = {id = "H-02", name = "Medevac-Air Trauma Chopper", dept = "EMS", icon = "🚁", cost = 95000, speed = 26, grade = 9, desc = "Critical Air Evacuation & Fast Trauma Care"},
	["H-03"] = {id = "H-03", name = "FireStorm Water-Dropper", dept = "Fire", icon = "🚁", cost = 85000, speed = 22, grade = 8, desc = "Aerial Wildfire & High-Rise Water Bombing"},
	["SWAT-02"] = {id = "SWAT-02", name = "Ghost-Cruiser Stealth", dept = "Police", icon = "🏎️", cost = 50000, speed = 18, grade = 7, desc = "High-Velocity Pursuit Interceptor"},
	["E-203"] = {id = "E-203", name = "Striker-9 Crash Truck", dept = "Fire", icon = "🚒", cost = 120000, speed = 14, grade = 9, desc = "Heavy Chemical & Aircraft Fire Control"},
	["CMD-01"] = {id = "CMD-01", name = "Mobile Command Bus", dept = "Police", icon = "🚐", cost = 150000, speed = 9, grade = 10, desc = "Mobile Overlord Tactical HQ Station"},
}

-- ========================
-- DEV PROMO CODES (Gift Code System)
-- ========================
local PROMO_CODES = {
	["OVERLORD2026"] = {cash = 25000, xp = 5000, desc = "Welcome to Overlord 2026! +$25K & +5K XP"},
	["FREECHOPPER"]  = {cash = 15000, xp = 3000, vehicle = "H-01", desc = "SkyWatch-01 Tactical Chopper Unlocked! +$15K Cash"},
	["RESCUE911"]    = {cash = 20000, xp = 4000, desc = "911 First Responder Aid +$20K & +4K XP"},
	["EMERGENCY"]    = {cash = 10000, xp = 2000, desc = "Emergency Relief Grant +$10K & +2K XP"},
	["COMMUNITY10K"] = {cash = 50000, xp = 10000, desc = "Community 10K Celebration +$50K & +10K XP"},
	["DEVVIP"]       = {cash = 100000, xp = 25000, vehicle = "H-02", desc = "Developer VIP Grant +$100K & Medevac-Air Chopper"},
}

-- ========================
-- 7-DAY LOGIN REWARDS
-- ========================
local DAILY_REWARDS = {
	[1] = {cash = 5000, xp = 1000, title = "Day 1 Recruit Bonus"},
	[2] = {cash = 10000, xp = 2000, title = "Day 2 Dispatch Aid"},
	[3] = {cash = 15000, xp = 3000, title = "Day 3 Tactical Grant"},
	[4] = {cash = 25000, xp = 4000, title = "Day 4 Field Operator"},
	[5] = {cash = 35000, xp = 5000, vehicle = "P-102", title = "Day 5 Interceptor SUV"},
	[6] = {cash = 50000, xp = 8000, title = "Day 6 Senior Command"},
	[7] = {cash = 100000, xp = 15000, vehicle = "H-02", title = "Day 7 Medevac Chopper + $100K!"},
}

-- ========================
-- HOURLY / PLAYTIME REWARDS
-- ========================
local PLAYTIME_REWARDS = {
	[1] = {requiredSeconds = 300, cash = 2500, xp = 500, title = "5 Min Patrol"},
	[2] = {requiredSeconds = 900, cash = 6000, xp = 1200, title = "15 Min Vigilance"},
	[3] = {requiredSeconds = 1800, cash = 15000, xp = 3000, title = "30 Min Dedication"},
	[4] = {requiredSeconds = 3600, cash = 30000, xp = 6000, title = "1 Hour Commander"},
	[5] = {requiredSeconds = 7200, cash = 75000, xp = 15000, title = "2 Hour Overlord Master"},
}

-- ========================
-- 16 DIVERSE CALL TEMPLATES (Guaranteed Variety)
-- ========================
local CALL_TEMPLATES = {
	{
		type = "4-Alarm Chemical Fire",
		dept = "Fire",
		sev = "Critical",
		title = "Chemical Plant Inferno",
		desc = "Toxic vapor cloud and chemical explosions reported. Structure unstable.",
		transcript = "ศูนย์วิทยุครับ! เกิดระเบิดที่โรงงานสารเคมี Westvale ถังเก็บสารพิษกำลังลุกไหม้ มีคนงานติดอยู่ข้างในหลายคน รีบส่งรถดับเพลิงมาช่วยด่วน!",
		req = "Heavy Engine + HazMat Unit",
		rewardCash = 1200,
		rewardXP = 1500,
	},
	{
		type = "Armed Bank Robbery",
		dept = "Police",
		sev = "Critical",
		title = "Downtown First National Heist",
		desc = "Multiple suspects with automatic weapons and hostage situation active.",
		transcript = "911 ช่วยด้วย! โจรติดอาวุธสงครามบุกยึดธนาคารกลาง Downtown มีเสียงปืนดังขึ้นหลายนัด ลูกค้าและพนักงานหมอบอยู่กับพื้น!",
		req = "SWAT Team + 2x Patrol Units",
		rewardCash = 1500,
		rewardXP = 1800,
	},
	{
		type = "Subway Transit Collapse",
		dept = "EMS",
		sev = "High",
		title = "Subway Tunnel Panic & Collapse",
		desc = "Power failure in transit tunnel, multiple passengers unresponsive due to heat and panic.",
		transcript = "ช่วยพวกเราด้วย! รถไฟใต้ดินสาย Downtown-Southgate ดับมืดสนิทในอุโมงค์ ผู้โดยสารเริ่มหมดสติและขาดอากาศหายใจ!",
		req = "ALS Ambulance + BLS Unit",
		rewardCash = 950,
		rewardXP = 1100,
	},
	{
		type = "Highway Tanker Pileup",
		dept = "Police",
		sev = "High",
		title = "Highway 101 Tanker Crash",
		desc = "Commercial tanker overturned across 4 lanes, secondary collisions with entrapment.",
		transcript = "เกิดอุบัติเหตุใหญ่บนสะพานเชื่อมทางหลวง HWY-101 รถบรรทุกน้ำมันพลิกคว่ำขวางทุกช่องทาง มีรถชนซ้ำซ้อนหลายคัน!",
		req = "Patrol Cruiser + Heavy Rescue + ALS",
		rewardCash = 1100,
		rewardXP = 1350,
	},
	{
		type = "High-Rise Apartment Blaze",
		dept = "Fire",
		sev = "Critical",
		title = "Downtown Tower Fire",
		desc = "Heavy black smoke billowing from 14th floor balcony. Evacuation in progress.",
		transcript = "ควันดำพวยพุ่งออกมาจากชั้น 14 ของคอนโดมิเนียมใจกลาง Downtown สัญญาณเตือนไฟไหม้ดังสนั่น บันไดหนีไฟถูกไฟปิดกั้น!",
		req = "Aerial Ladder + 2x Engines",
		rewardCash = 1400,
		rewardXP = 1600,
	},
	{
		type = "Violent Domestic Disturbance",
		dept = "Police",
		sev = "Medium",
		title = "Oakhaven Domestic Dispute",
		desc = "Disturbance call with weapons threatened. Children present on premises.",
		transcript = "ส่งตำรวจมาที่บ้านด่วนค่ะ! มีคนบุกพังประตูหลังบ้านเข้ามาพร้อมอาวุธและกำลังข่มขู่คนในบ้าน มีเด็กอยู่ข้างในด้วย!",
		req = "2x Police Patrol",
		rewardCash = 650,
		rewardXP = 800,
	},
	{
		type = "Industrial Chlorine Leak",
		dept = "Fire",
		sev = "High",
		title = "Harbor Chemical Warehouse",
		desc = "Pressurized chlorine cylinder breached. Evacuation zone 500 meters.",
		transcript = "รปภ. ท่าเรือ Southgate รายงานด่วน! ถังคลอรีนแรงดันสูงที่โกดังเทียบเรือ 4 รั่วไหล มีควันเหลืองฟุ้งกระจาย คนงานไอเป็นเลือด!",
		req = "HazMat Unit + Engine + BLS",
		rewardCash = 1000,
		rewardXP = 1250,
	},
	{
		type = "Pedestrian Hit and Run",
		dept = "EMS",
		sev = "Medium",
		title = "Main Street Pedestrian Strike",
		desc = "Victim unconscious on sidewalk, suspect vehicle fled eastbound.",
		transcript = "มีรถเก๋งสีดำฝ่าไฟแดงชนคนข้ามถนนตรงสี่แยก Downtown แล้วขับหนีไปทางทิศตะวันออก! ผู้บาดเจ็บนอนหมดสติเลือดออกมาก!",
		req = "ALS Medic + Patrol Cruiser",
		rewardCash = 700,
		rewardXP = 850,
	},
	{
		type = "Harbor Fuel Barge Fire",
		dept = "Fire",
		sev = "Critical",
		title = "Southgate Pier Barge Fire",
		desc = "Docked diesel barge engulfed. Risk of spreading to refinery storage.",
		transcript = "เหตุฉุกเฉินท่าเรือเทียบเรือ 7! ท่อเติมน้ำมันดีเซลแตกและเกิดประกายไฟระเบิด เปลวไฟสูงกว่า 15 เมตรกลางผืนน้ำในอ่าว!",
		req = "Fire Engine + HazMat Unit",
		rewardCash = 1300,
		rewardXP = 1500,
	},
	{
		type = "Mountain Valley Brush Fire",
		dept = "Fire",
		sev = "Critical",
		title = "Rapid Brush Wildfire",
		desc = "Wind gusts driving fire toward suburban developments.",
		transcript = "ไฟป่าแคนยอนลุกลามอย่างรวดเร็ว! ลมกระโชกแรงพัดพาเปลวไฟข้ามแนวสันเขา มุ่งหน้าเข้าสู่หมู่บ้านจัดสรรใน Oakhaven!",
		req = "Wildland Pumper + Engine",
		rewardCash = 1600,
		rewardXP = 1800,
	},
	{
		type = "Jewelry Store Armed Robbery",
		dept = "Police",
		sev = "High",
		title = "Downtown Gold & Diamond Heist",
		desc = "Sledgehammer robbery in progress, 3 masked suspects armed with pistols.",
		transcript = "มีคนร้ายสวมไอ้โม่ง 3 คนใช้ค้อนปอนด์ทุบกระจกร้านเพชรกลางห้าง Downtown! ถือปืนพกข่มขู่ รปภ. กำลังกวาดทองคำ!",
		req = "Supervisor Cruiser + Patrol",
		rewardCash = 1050,
		rewardXP = 1300,
	},
	{
		type = "Severe Pediatric Cardiac",
		dept = "EMS",
		sev = "Critical",
		title = "NorthRidge Acute Respiratory",
		desc = "Unresponsive infant with severe airway obstruction, CPR in progress.",
		transcript = "ช่วยลูกดิฉันด้วยค่ะ! เด็กหยุดหายใจ หมดสติ ไม่ตอบสนอง กำลังทำ CPR ตามคำแนะนำวิทยุ รีบส่งรถพยาบาลฉุกเฉินมาที!",
		req = "Advanced Cardiac ALS",
		rewardCash = 1200,
		rewardXP = 1400,
	},
	{
		type = "Structural Warehouse Collapse",
		dept = "Fire",
		sev = "Critical",
		title = "Freight Depot Roof Collapse",
		desc = "Heavy steel beams caved in at Westvale freight hub. Multiple trapped victims.",
		transcript = "หลังคาโกดังขนส่งสินค้า Westvale พังถล่มลงมา! คานเหล็กขนาดใหญ่ทับคนงาน มีเสียงคนร้องขอความช่วยเหลือจากใต้ซากปรักหักพัง!",
		req = "Heavy Engine + Ladder + Medic",
		rewardCash = 1500,
		rewardXP = 1750,
	},
	{
		type = "High-Speed Highway Pursuit",
		dept = "Police",
		sev = "High",
		title = "Stolen Vehicle Highway Chase",
		desc = "Suspect driving stolen sports car at 140mph toward suspension bridge.",
		transcript = "สายตรวจ 101 กำลังไล่ล่ารถสปอร์ตสีแดงที่ถูกขโมยมา! ผู้ต้องสงสัยขับซิ่งด้วยความเร็วเกิน 140 ไมล์/ชม. มุ่งหน้าสะพานแขวน!",
		req = "Highway Cruiser + SkyWatch Chopper",
		rewardCash = 1250,
		rewardXP = 1450,
	},
	{
		type = "Electrical Substation Explosion",
		dept = "Fire",
		sev = "High",
		title = "NorthRidge Power Substation Arc",
		desc = "High voltage transformer arc flash fire. Power grid compromised.",
		transcript = "หม้อแปลงไฟฟ้าแรงสูงระเบิดที่สถานีไฟฟ้าย่อย NorthRidge! ประกายไฟอาร์คและควันดำพุ่งขึ้นสู่ท้องฟ้า ไฟฟ้าดับเป็นวงกว้าง!",
		req = "Engine + HazMat Unit",
		rewardCash = 1150,
		rewardXP = 1350,
	},
	{
		type = "Suspicious Metro Package",
		dept = "Police",
		sev = "Medium",
		title = "Metro Central Terminal Threat",
		desc = "Unattended ticking box found near platform 2. Evacuation required.",
		transcript = "เจ้าหน้าที่สถานีรถไฟ Downtown พบกระเป๋าต้องสงสัยวางทิ้งไว้ มีสายไฟโผล่ออกมา กำลังอพยพผู้โดยสารออกจากชานชาลา!",
		req = "K9 Unit + Patrol Cruiser",
		rewardCash = 800,
		rewardXP = 950,
	},
}

local UPGRADES = {
	DISPATCH = {name = "Dispatch Frequency Channels", base = 3250, mult = 1.45, maxTier = 17, effect = "+1 Incident Channel"},
	CALLS = {name = "911 High-Speed Trunk Lines", base = 2750, mult = 1.35, maxTier = 10, effect = "+1 Queue Phone Slot"},
	RADIO = {name = "Tactical Microwave Repeaters", base = 6200, mult = 1.55, maxTier = 10, effect = "+8% Response Speed"},
	TRAINING = {name = "Dispatcher Academy Certification", base = 8000, mult = 1.5, maxTier = 10, effect = "+15% XP Gain"},
}

local DEFAULT_DATA = {
	cash = 29743,
	xp = 72000,
	level = 28,
	callsHandled = 1452,
	callsResolved = 1380,
	shiftsWorked = 87,
	hoursWorked = 340,
	city = "Downtown",
	shift = "Evening",
	onDuty = false,
	upgrades = {DISPATCH = 1, CALLS = 1, RADIO = 0, TRAINING = 0},
	redeemedCodes = {},
	dailyStreak = 0,
	lastDailyClaim = 0,
	playtimeClaimed = {},
	ownedVehicles = {
		["P-101"] = true, ["P-102"] = true, ["P-103"] = true,
		["K9-01"] = true, ["SGT-01"] = true, ["SWAT-01"] = true,
		["E-201"] = true, ["E-202"] = true, ["L-201"] = true,
		["HZ-01"] = true, ["A-301"] = true, ["A-302"] = true,
		["A-303"] = true,
	},
}

local playerData = {}
local sessionJoinTime = {}
local activeIncidents = {}
local pendingCalls = {}
local incidentSequence = 1000

local function broadcast(evName, ...)
	local args = {...}
	local ev = RE and RE:FindFirstChild(evName)
	if ev then
		pcall(function() ev:FireAllClients(table.unpack(args)) end)
	end
end

local function sendClient(player, evName, ...)
	local args = {...}
	local ev = RE and RE:FindFirstChild(evName)
	if ev then
		pcall(function() ev:FireClient(player, table.unpack(args)) end)
	end
end

local function getMaxQueue(data)
	if not data then return 4 end
	local lvl = data.level or 1
	local bonus = math.floor(lvl / 10)
	local trunkBonus = (data.upgrades and data.upgrades.CALLS) or 0
	return 2 + bonus + trunkBonus
end

local function getActiveIncidentCount()
	local c = 0
	for _, inc in pairs(activeIncidents) do
		if inc.status ~= "resolved" then c = c + 1 end
	end
	return c
end

local function findUnit(queryId)
	if not queryId then return UNITS[1] end
	local q = queryId:upper()
	for _, u in ipairs(UNITS) do
		if u.id:upper() == q or (u.alias and u.alias:upper() == q) then
			return u
		end
	end
	for _, u in ipairs(UNITS) do
		if u.id:upper():find(q) or q:find(u.id:upper()) or (u.alias and u.alias:upper():find(q)) or (u.alias and q:find(u.alias:upper())) then
			return u
		end
	end
	for _, u in ipairs(UNITS) do
		if u.name:upper():find(q) then return u end
	end
	return UNITS[1]
end

local function loadData(player)
	local key = "player_" .. player.UserId
	local data = nil
	if playerStore then
		local ok, saved = pcall(function() return playerStore:GetAsync(key) end)
		if ok and saved and type(saved) == "table" then
			data = saved
		end
	end
	if not data then
		data = {}
		for k, v in pairs(DEFAULT_DATA) do
			if type(v) == "table" then
				local copy = {}
				for tk, tv in pairs(v) do copy[tk] = tv end
				data[k] = copy
			else
				data[k] = v
			end
		end
	else
		-- Merge any missing v8 fields cleanly
		for k, v in pairs(DEFAULT_DATA) do
			if data[k] == nil then
				if type(v) == "table" then
					local copy = {}
					for tk, tv in pairs(v) do copy[tk] = tv end
					data[k] = copy
				else
					data[k] = v
				end
			end
		end
	end
	
	playerData[player.UserId] = data
	sessionJoinTime[player.UserId] = os.time()
	return data
end

local function saveData(player)
	local data = playerData[player.UserId]
	if not data or not playerStore then return end
	pcall(function() playerStore:SetAsync("player_" .. player.UserId, data) end)
end

-- ==========================================
-- 911 INCOMING CALL GENERATOR (Zero Mock, De-duplicated)
-- ==========================================
local function generateIncomingCall(targetCityId)
	incidentSequence = incidentSequence + 1
	local incId = "INC-" .. string.format("%03d", incidentSequence % 900 + 100)
	
	local cityKeys = {"Downtown", "Westvale", "NorthRidge", "Southgate", "Oakhaven"}
	local chosenCity = targetCityId or cityKeys[math.random(1, #cityKeys)]
	local cityData = CITIES[chosenCity] or CITIES.Downtown
	
	-- Filter out templates that are already active in target city
	local available = {}
	for _, tmpl in ipairs(CALL_TEMPLATES) do
		local alreadyActive = false
		for _, inc in pairs(activeIncidents) do
			if inc.status ~= "resolved" and inc.type == tmpl.type and inc.city == chosenCity then
				alreadyActive = true
				break
			end
		end
		for _, call in pairs(pendingCalls) do
			if call.type == tmpl.type and call.city == chosenCity then
				alreadyActive = true
				break
			end
		end
		if not alreadyActive then
			table.insert(available, tmpl)
		end
	end
	if #available == 0 then available = CALL_TEMPLATES end
	local tmpl = available[math.random(1, #available)]
	
	local callerPool = {
		"นายกิตติศักดิ์ (พลเมือง)", "นางสาวพิมลดา (ผู้จัดการร้าน)", "นายสุรชัย (ผู้เห็นเหตุการณ์)", 
		"คุณวิภาดา (ชาวบ้าน)", "ร.ป.ภ. ประจำพื้นที่", "ผู้จัดการอาคาร", "นายธนกร (คนขับรถ)", "คุณรัตนา (ผู้ใช้ทางหลวง)"
	}
	local callerName = callerPool[math.random(1, #callerPool)]
	
	local spreadX = (math.random() - 0.5) * 0.12
	local spreadY = (math.random() - 0.5) * 0.12
	local mx = math.clamp(cityData.mx + spreadX, 0.08, 0.90)
	local my = math.clamp(cityData.my + spreadY, 0.08, 0.90)
	
	local callData = {
		id = incId,
		type = tmpl.type,
		dept = tmpl.dept,
		severity = tmpl.sev,
		title = tmpl.title,
		desc = tmpl.desc,
		transcript = tmpl.transcript,
		req = tmpl.req,
		caller = callerName,
		city = chosenCity,
		cityName = cityData.name,
		mx = mx,
		my = my,
		rewardCash = tmpl.rewardCash,
		rewardXP = tmpl.rewardXP,
		status = "ringing",
		time = os.time(),
		assignedUnits = {},
		isPrank = (math.random(1, 10) == 1),
	}
	
	pendingCalls[incId] = callData
	
	-- Broadcast incoming 911 call to dispatchers
	for _, p in ipairs(Players:GetPlayers()) do
		local d = playerData[p.UserId] or DEFAULT_DATA
		local maxQ = getMaxQueue(d)
		local curActive = getActiveIncidentCount()
		sendClient(p, "Incoming911Call", callData, curActive, maxQ)
	end
	
	print("[GM v8.0] Incoming 911 Call ringing: " .. incId .. " in " .. chosenCity .. " (" .. tmpl.title .. ")")
	return callData
end

local function initializeHandlers()
	if RF then
		local gpd = RF:FindFirstChild("GetPlayerData")
		if gpd then
			gpd.OnServerInvoke = function(p)
				local d = playerData[p.UserId] or DEFAULT_DATA
				d.maxQueue = getMaxQueue(d)
				d.activeQueue = getActiveIncidentCount()
				return d
			end
		end

		local gcs = RF:FindFirstChild("GetCityStatus")
		if gcs then gcs.OnServerInvoke = function() return CITIES end end

		local gu = RF:FindFirstChild("GetUnits")
		if gu then gu.OnServerInvoke = function() return UNITS end end

		local gi = RF:FindFirstChild("GetIncidents")
		if gi then
			gi.OnServerInvoke = function()
				local list = {}
				for _, inc in pairs(activeIncidents) do
					if inc.status ~= "resolved" then table.insert(list, inc) end
				end
				return list
			end
		end

		local glb = RF:FindFirstChild("GetLeaderboard")
		if glb then
			glb.OnServerInvoke = function()
				return {
					{name = "Commander_Vance", level = 52, resolved = 3420, efficiency = "98%"},
					{name = "Chief_Miller", level = 47, resolved = 2950, efficiency = "96%"},
					{name = "Captain_Ross", level = 41, resolved = 2410, efficiency = "95%"},
					{name = "SeniorDisp_Kim", level = 36, resolved = 1980, efficiency = "94%"},
				}
			end
		end
	end

	-- 1. ANSWER 911 CALL (Accept into Active Incident Queue)
	local ac = RE:FindFirstChild("Answer911Call")
	if ac then
		ac.OnServerEvent:Connect(function(player, callId)
			local data = playerData[player.UserId]
			if not data then return end
			local callData = pendingCalls[callId]
			if not callData then return end
			
			local maxQ = getMaxQueue(data)
			local curActive = getActiveIncidentCount()
			
			if curActive >= maxQ then
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "⚠️ QUEUE FULL (" .. curActive .. "/" .. maxQ .. ")",
					msg = "Trunk lines at capacity! Resolve active emergencies or upgrade Trunk Lines with Cash.",
				})
				return
			end
			
			-- Accept call and promote to active incident
			pendingCalls[callId] = nil
			callData.status = "pending"
			activeIncidents[callId] = callData
			
			data.xp = data.xp + 100
			if data.xp >= data.level * 3000 then
				data.level = data.level + 1
			end
			
			broadcast("CallIncoming", callData)
			sendClient(player, "AlertBroadcast", {
				type = "info",
				title = "📞 911 CALL ACCEPTED",
				msg = callData.title .. " (" .. callData.city .. ") added to active queue! +100 XP",
			})
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	-- 2. REJECT / SCREEN 911 CALL
	local rjc = RE:FindFirstChild("Reject911Call")
	if rjc then
		rjc.OnServerEvent:Connect(function(player, callId, isPrankScreen)
			local data = playerData[player.UserId]
			if not data then return end
			local callData = pendingCalls[callId]
			if not callData then return end
			
			if isPrankScreen then
				if callData.isPrank then
					pendingCalls[callId] = nil
					data.xp = data.xp + 250
					sendClient(player, "AlertBroadcast", {
						type = "success",
						title = "✅ PRANK CALL NEUTRALIZED",
						msg = "Vigilant call screening caught a false alarm! +250 XP earned.",
					})
					sendClient(player, "SyncPlayerData", data)
					saveData(player)
				else
					sendClient(player, "AlertBroadcast", {
						type = "alert",
						title = "⚠️ GENUINE EMERGENCY VERIFIED",
						msg = "Caller is in severe distress! Please answer the call and dispatch units.",
					})
				end
			else
				pendingCalls[callId] = nil
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = "📞 CALL TERMINATED",
					msg = "Call " .. callId .. " was dropped/dismissed.",
				})
			end
		end)
	end

	-- 3. SHIFT CHANGE
	local sc = RE:FindFirstChild("ShiftChange")
	if sc then
		sc.OnServerEvent:Connect(function(player, action, city, shift)
			local data = playerData[player.UserId]
			if not data then return end
			
			if action == "clockIn" then
				data.onDuty = true
				data.city = city or data.city
				data.shift = shift or data.shift
				data.shiftsWorked = (data.shiftsWorked or 0) + 1
				
				sendClient(player, "AlertBroadcast", {
					type = "shift",
					title = "🟢 SHIFT COMMENCED: " .. data.city:upper(),
					msg = "Duty Shift: " .. data.shift:upper() .. " | Radar & 911 Lines Live",
				})
			else
				data.onDuty = false
				sendClient(player, "AlertBroadcast", {
					type = "shift",
					title = "🔴 SHIFT ENDED (OFF DUTY)",
					msg = "Completed shift in " .. (data.city or "Metropolitan") .. ". Logs synchronized.",
				})
			end
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	-- 4. DISPATCH UNIT (Supports Fast Helicopter Dispatch)
	local du = RE:FindFirstChild("DispatchUnit")
	if du then
		du.OnServerEvent:Connect(function(player, unitId, incidentId)
			local data = playerData[player.UserId]
			if not data then return end
			
			local unit = findUnit(unitId)
			
			-- Check ownership for purchasable fleet
			if (unit.id:find("^H%-") or unit.id:find("^SWAT%-02") or unit.id:find("^E%-203") or unit.id:find("^CMD%-01")) and not (data.ownedVehicles and data.ownedVehicles[unit.id]) then
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "VEHICLE NOT OWNED",
					msg = unit.name .. " is locked! Purchase from Fleet Roster or redeem code.",
				})
				return
			end
			
			local inc = activeIncidents[incidentId]
			if not inc then
				for _, i in pairs(activeIncidents) do
					if i.status == "pending" then inc = i break end
				end
			end
			
			if unit.status == "available" then
				unit.status = "responding"
				data.xp = data.xp + 400
				data.cash = data.cash + 150
				
				local isChopper = (unit.icon == "🚁" or (unit.speed and unit.speed >= 20))
				local dispatchMsg = isChopper 
					and (unit.name .. " airborne code 3! ETA 4 sec | +$150 | +400 XP") 
					or (unit.name .. " rolling code 3 to " .. (inc and inc.title or "Emergency Scene") .. " | +$150 | +400 XP")
				
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = isChopper and "🚁 AERIAL RESPONSE DISPATCHED" or "🚨 UNITS ROLLING CODE 3",
					msg = dispatchMsg,
				})
				
				if inc then
					inc.status = "responding"
					table.insert(inc.assignedUnits, unit.id)
					broadcast("IncidentUpdate", inc.id, "responding", unit.id)
				end
				
				local travelTime = isChopper and 5 or 14
				
				task.delay(travelTime, function()
					unit.status = "available"
					if inc and inc.status ~= "resolved" then
						inc.status = "resolved"
						local rewardCash = inc.rewardCash or 1000
						local rewardXP = inc.rewardXP or 1200
						
						data.callsHandled = (data.callsHandled or 0) + 1
						data.callsResolved = (data.callsResolved or 0) + 1
						data.cash = data.cash + rewardCash
						data.xp = data.xp + rewardXP
						
						if data.xp >= data.level * 3000 then
							data.level = data.level + 1
							broadcast("AlertBroadcast", {
								type = "welcome",
								title = "⭐ PROMOTION ACHIEVED!",
								msg = player.Name .. " reached Lead Dispatcher LVL " .. data.level .. "!",
							})
						end
						
						broadcast("IncidentUpdate", inc.id, "resolved", unit.id)
						sendClient(player, "AlertBroadcast", {
							type = "success",
							title = "✅ 10-4 SCENE SECURED & RESOLVED",
							msg = inc.title .. " closed! Earned +$" .. rewardCash .. " & +" .. rewardXP .. " XP!",
						})
						sendClient(player, "SyncPlayerData", data)
						saveData(player)
					end
				end)
			else
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "UNIT BUSY",
					msg = unit.name .. " is currently " .. unit.status,
				})
			end
			saveData(player)
		end)
	end

	-- 5. UNIT RETURN
	local ur = RE:FindFirstChild("UnitReturn")
	if ur then
		ur.OnServerEvent:Connect(function(player, unitId)
			local unit = findUnit(unitId)
			if unit then
				unit.status = "available"
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = "UNIT IN QUARTERS",
					msg = unit.name .. " returned to base and is 10-8 Available.",
				})
			end
		end)
	end

	-- 6. MARK PRANK
	local mp = RE:FindFirstChild("MarkPrank")
	if mp then
		mp.OnServerEvent:Connect(function(player, incId, isPrank)
			local data = playerData[player.UserId]
			if not data then return end
			if isPrank then
				data.xp = data.xp + 250
				if activeIncidents[incId] then
					activeIncidents[incId].status = "resolved"
					broadcast("IncidentUpdate", incId, "resolved", "NONE")
				end
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = "PRANK CALL SCREENED",
					msg = "False alarm neutralized! Earned +250 XP for dispatcher vigilance.",
				})
				sendClient(player, "SyncPlayerData", data)
				saveData(player)
			end
		end)
	end

	-- 7. INCIDENT UPDATE
	local iu = RE:FindFirstChild("IncidentUpdate")
	if iu then
		iu.OnServerEvent:Connect(function(player, incId, status)
			local data = playerData[player.UserId]
			if not data then return end
			local inc = activeIncidents[incId]
			if status == "resolved" and inc and inc.status ~= "resolved" then
				inc.status = "resolved"
				local rewardCash = inc.rewardCash or 1000
				local rewardXP = inc.rewardXP or 1200
				data.callsHandled = (data.callsHandled or 0) + 1
				data.callsResolved = (data.callsResolved or 0) + 1
				data.cash = data.cash + rewardCash
				data.xp = data.xp + rewardXP
				
				if data.xp >= data.level * 3000 then
					data.level = data.level + 1
					broadcast("AlertBroadcast", {
						type = "welcome",
						title = "⭐ PROMOTION ACHIEVED!",
						msg = player.Name .. " reached Lead Dispatcher LVL " .. data.level .. "!",
					})
				end
				
				broadcast("IncidentUpdate", incId, "resolved", "MANUAL")
				sendClient(player, "AlertBroadcast", {
					type = "success",
					title = "✅ 10-4 INCIDENT RESOLVED",
					msg = inc.title .. " closed. +$" .. rewardCash .. " & +" .. rewardXP .. " XP!",
				})
				sendClient(player, "SyncPlayerData", data)
				saveData(player)
			end
		end)
	end

	-- 8. CITY DIRECTIVES
	local cd = RE:FindFirstChild("CityDirective")
	if cd then
		cd.OnServerEvent:Connect(function(player, cityId, directive)
			local data = playerData[player.UserId]
			if not data then return end
			local cData = CITIES[cityId] or CITIES.Downtown
			
			if directive == "curfew" then
				if data.cash >= 500 then
					data.cash = data.cash - 500
					cData.security = math.clamp(cData.security + 15, 0, 100)
					broadcast("AlertBroadcast", {
						type = "alert",
						title = "🚨 EMERGENCY CURFEW IN EFFECT",
						msg = player.Name .. " declared strict municipal curfew in " .. cData.name .. "! Security +15%",
					})
				else
					sendClient(player, "AlertBroadcast", {type = "error", title = "INSUFFICIENT FUNDS", msg = "Curfew declaration requires $500 municipal budget."})
				end
			elseif directive == "fire_reserve" then
				if data.cash >= 300 then
					data.cash = data.cash - 300
					cData.danger = math.clamp(cData.danger - 1, 1, 5)
					broadcast("AlertBroadcast", {
						type = "info",
						title = "🚒 FIRE RESERVES MOBILIZED",
						msg = player.Name .. " activated auxiliary fire reserves in " .. cData.name .. "! Threat level reduced.",
					})
				else
					sendClient(player, "AlertBroadcast", {type = "error", title = "INSUFFICIENT FUNDS", msg = "Fire reserves mobilization requires $300."})
				end
			elseif directive == "patrol_surge" then
				if data.cash >= 400 then
					data.cash = data.cash - 400
					cData.security = math.clamp(cData.security + 10, 0, 100)
					broadcast("AlertBroadcast", {
						type = "info",
						title = "🚓 HIGH-VISIBILITY POLICE SURGE",
						msg = player.Name .. " flooded " .. cData.name .. " with tactical patrols! Security +10%",
					})
				else
					sendClient(player, "AlertBroadcast", {type = "error", title = "INSUFFICIENT FUNDS", msg = "Patrol surge requires $400."})
				end
			elseif directive == "neighbor_aid" then
				broadcast("AlertBroadcast", {
					type = "request",
					title = "🤝 MUTUAL AID CALLED FOR " .. cData.name:upper(),
					msg = player.Name .. " requests all neighboring municipal districts to provide tactical reinforcements!",
				})
			end
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	-- 9. BUY ITEM (Cash Packs)
	local bi = RE:FindFirstChild("BuyItem")
	if bi then
		bi.OnServerEvent:Connect(function(player, packId)
			local data = playerData[player.UserId]
			if not data then return end
			local pack = CASH_PACKS[packId]
			if pack then
				local totalCash = math.floor(pack.cash * (1 + pack.bonus / 100))
				data.cash = data.cash + totalCash
				sendClient(player, "AlertBroadcast", {
					type = "purchase",
					title = "💳 CASH PACK CREDITED",
					msg = "Successfully received +$" .. string.format("%d", totalCash) .. " (" .. pack.name .. ")!",
				})
				sendClient(player, "SyncPlayerData", data)
				saveData(player)
			end
		end)
	end

	-- 10. UPGRADE STATION (Supports Trunk Lines Queue Expansion with Cash)
	local us = RE:FindFirstChild("UpgradeStation")
	if us then
		us.OnServerEvent:Connect(function(player, upgradeId)
			local data = playerData[player.UserId]
			if not data then return end
			data.upgrades = data.upgrades or {}
			local upg = UPGRADES[upgradeId]
			if upg then
				local tier = data.upgrades[upgradeId] or 0
				if tier >= upg.maxTier then
					sendClient(player, "AlertBroadcast", {type = "error", title = "MAX TIER", msg = upg.name .. " is fully upgraded!"})
					return
				end
				local cost = math.floor(upg.base * (upg.mult ^ tier))
				if data.cash >= cost then
					data.cash = data.cash - cost
					data.upgrades[upgradeId] = tier + 1
					
					local extraNote = ""
					if upgradeId == "CALLS" then
						local newMax = getMaxQueue(data)
						extraNote = " • New Queue Capacity: " .. newMax .. " Slots!"
					end
					
					sendClient(player, "AlertBroadcast", {
						type = "upgrade",
						title = "⚡ FACILITY UPGRADED!",
						msg = upg.name .. " now Tier " .. (tier + 1) .. "! (" .. upg.effect .. ")" .. extraNote,
					})
					sendClient(player, "SyncPlayerData", data)
					saveData(player)
				else
					sendClient(player, "AlertBroadcast", {type = "error", title = "INSUFFICIENT FUNDS", msg = "Need $" .. cost .. " | Balance: $" .. data.cash})
				end
			end
		end)
	end

	-- 11. CITY CHAT
	local cc = RE:FindFirstChild("CityChat")
	if cc then
		cc.OnServerEvent:Connect(function(player, city, msg, msgType)
			if type(msg) ~= "string" or msg == "" then return end
			local data = playerData[player.UserId]
			local chatPayload = {
				sender = player.Name,
				city = city or "Downtown",
				msg = msg,
				type = msgType or "normal",
				rank = (data and data.level >= 25) and "Commander" or "Lead Dispatcher",
			}
			if msg:sub(1, 10) == "/req-unit " then
				local ut = msg:sub(11)
				chatPayload.msg = "[MUTUAL AID DISPATCH] " .. player.Name .. " requesting " .. ut .. " in " .. city
				chatPayload.type = "mutual_aid"
				broadcast("AlertBroadcast", {type = "request", title = "MUTUAL AID CALL", msg = player.Name .. " needs " .. ut .. " in " .. city})
			elseif msg == "/recall" then
				chatPayload.msg = "[TACTICAL RECALL] All non-emergency units return to quarters"
				chatPayload.type = "recall"
			elseif msg:sub(1, 7) == "/alert " then
				local text = msg:sub(8)
				chatPayload.msg = "[PRIORITY BROADCAST] " .. text
				chatPayload.type = "alert"
				broadcast("AlertBroadcast", {type = "alert", title = "ALL-CHANNELS BROADCAST", msg = text})
			end
			broadcast("CityChat", chatPayload)
		end)
	end

	-- 12. REDEEM GIFT CODE
	local rc = RE:FindFirstChild("RedeemCode")
	if rc then
		rc.OnServerEvent:Connect(function(player, rawCode)
			local data = playerData[player.UserId]
			if not data then return end
			if type(rawCode) ~= "string" then return end
			
			local code = string.upper(string.gsub(rawCode, "%s+", ""))
			local promo = PROMO_CODES[code]
			if not promo then
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "INVALID PROMO CODE",
					msg = "Code '" .. code .. "' does not exist or has expired.",
				})
				return
			end
			
			data.redeemedCodes = data.redeemedCodes or {}
			if data.redeemedCodes[code] then
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "ALREADY REDEEMED",
					msg = "You have already claimed promo code '" .. code .. "'!",
				})
				return
			end
			
			data.redeemedCodes[code] = os.time()
			data.cash = data.cash + (promo.cash or 0)
			data.xp = data.xp + (promo.xp or 0)
			
			if promo.vehicle then
				data.ownedVehicles = data.ownedVehicles or {}
				data.ownedVehicles[promo.vehicle] = true
			end
			
			if data.xp >= data.level * 3000 then
				data.level = data.level + 1
			end
			
			sendClient(player, "AlertBroadcast", {
				type = "purchase",
				title = "🎁 PROMO CODE REDEEMED!",
				msg = promo.desc,
			})
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	-- 13. CLAIM DAILY LOGIN REWARD
	local cdr = RE:FindFirstChild("ClaimDailyReward")
	if cdr then
		cdr.OnServerEvent:Connect(function(player)
			local data = playerData[player.UserId]
			if not data then return end
			
			local now = os.time()
			local lastClaim = data.lastDailyClaim or 0
			local elapsed = now - lastClaim
			
			if lastClaim > 0 and elapsed < 86400 then
				local remain = 86400 - elapsed
				local h = math.floor(remain / 3600)
				local m = math.floor((remain % 3600) / 60)
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = "⏳ DAILY REWARD COOLDOWN",
					msg = "Next check-in reward available in " .. h .. "h " .. m .. "m!",
				})
				return
			end
			
			local streak = data.dailyStreak or 0
			if lastClaim > 0 and elapsed > (86400 * 2) then
				streak = 1
			else
				streak = (streak % 7) + 1
			end
			
			data.dailyStreak = streak
			data.lastDailyClaim = now
			
			local reward = DAILY_REWARDS[streak] or DAILY_REWARDS[1]
			data.cash = data.cash + (reward.cash or 0)
			data.xp = data.xp + (reward.xp or 0)
			
			if reward.vehicle then
				data.ownedVehicles = data.ownedVehicles or {}
				data.ownedVehicles[reward.vehicle] = true
			end
			
			if data.xp >= data.level * 3000 then
				data.level = data.level + 1
			end
			
			sendClient(player, "AlertBroadcast", {
				type = "success",
				title = "📅 DAY " .. streak .. " CHECK-IN CLAIMED!",
				msg = reward.title .. " (+$" .. reward.cash .. ", +" .. reward.xp .. " XP) credited to account!",
			})
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	-- 14. CLAIM PLAYTIME REWARD
	local cpr = RE:FindFirstChild("ClaimPlaytimeReward")
	if cpr then
		cpr.OnServerEvent:Connect(function(player, tierNum)
			local data = playerData[player.UserId]
			if not data then return end
			
			local tier = tonumber(tierNum) or 1
			local pTier = PLAYTIME_REWARDS[tier]
			if not pTier then return end
			
			local joinT = sessionJoinTime[player.UserId] or os.time()
			local elapsed = os.time() - joinT
			
			if elapsed < pTier.requiredSeconds then
				local remain = pTier.requiredSeconds - elapsed
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "⏳ PLAYTIME REQUIRED",
					msg = "Play for " .. math.ceil(remain / 60) .. " more minutes to claim " .. pTier.title .. "!",
				})
				return
			end
			
			data.playtimeClaimed = data.playtimeClaimed or {}
			if data.playtimeClaimed[tostring(tier)] then
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = "REWARD CLAIMED",
					msg = pTier.title .. " has already been claimed for this session!",
				})
				return
			end
			
			data.playtimeClaimed[tostring(tier)] = true
			data.cash = data.cash + pTier.cash
			data.xp = data.xp + pTier.xp
			
			if data.xp >= data.level * 3000 then
				data.level = data.level + 1
			end
			
			sendClient(player, "AlertBroadcast", {
				type = "success",
				title = "⏱️ PLAYTIME REWARD CLAIMED!",
				msg = "Claimed " .. pTier.title .. "! +$" .. pTier.cash .. " & +" .. pTier.xp .. " XP",
			})
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	-- 15. BUY VEHICLE (Choppers & Special Fleet)
	local bv = RE:FindFirstChild("BuyVehicle")
	if bv then
		bv.OnServerEvent:Connect(function(player, vehicleId)
			local data = playerData[player.UserId]
			if not data then return end
			
			local vData = PURCHASABLE_VEHICLES[vehicleId]
			if not vData then return end
			
			data.ownedVehicles = data.ownedVehicles or {}
			if data.ownedVehicles[vehicleId] then
				sendClient(player, "AlertBroadcast", {
					type = "info",
					title = "ALREADY OWNED",
					msg = vData.name .. " is already in your fleet roster!",
				})
				return
			end
			
			if data.cash < vData.cost then
				sendClient(player, "AlertBroadcast", {
					type = "error",
					title = "INSUFFICIENT FUNDS",
					msg = "Requires $" .. vData.cost .. " | Current Balance: $" .. data.cash,
				})
				return
			end
			
			data.cash = data.cash - vData.cost
			data.ownedVehicles[vehicleId] = true
			
			sendClient(player, "AlertBroadcast", {
				type = "purchase",
				title = "🚁 NEW VEHICLE ACQUIRED!",
				msg = vData.name .. " is now active in your fleet!",
			})
			sendClient(player, "SyncPlayerData", data)
			saveData(player)
		end)
	end

	print("[GM v8.0] All master server handlers live!")
end

Players.PlayerAdded:Connect(function(player)
	task.spawn(function()
		local data = loadData(player)
		task.wait(1.5)
		sendClient(player, "SyncPlayerData", data)
		task.wait(0.5)
		sendClient(player, "AlertBroadcast", {
			type = "welcome",
			title = "EMERGENCY OVERLORD COMMAND",
			msg = "Welcome back, Operator " .. player.Name .. "! Ready for duty.",
		})
		task.wait(0.5)
		for _, inc in pairs(activeIncidents) do
			if inc.status ~= "resolved" then
				sendClient(player, "CallIncoming", inc)
				task.wait(0.1)
			end
		end
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	saveData(player)
	playerData[player.UserId] = nil
	sessionJoinTime[player.UserId] = nil
end)

for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(loadData, p)
end

-- Incoming Call Routine: Rings an incoming 911 call every 20-35 seconds
task.spawn(function()
	while true do
		task.wait(math.random(20, 35))
		local activeCount = getActiveIncidentCount()
		if activeCount < 10 then
			generateIncomingCall()
		end
	end
end)

task.spawn(function()
	while true do
		task.wait(60)
		for _, p in ipairs(Players:GetPlayers()) do
			saveData(p)
		end
	end
end)

-- Initial Call after boot: rings the first 911 emergency call cleanly
task.delay(4, function()
	generateIncomingCall("Downtown")
end)

initializeHandlers()
print("[GameManager v8.0] MASTER SYSTEM LIVE - Real 911 Answering Pipeline, Queue System, & Multi-district Simulation!")
