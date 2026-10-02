-- Emergency Overlord ClientManager v9.0 - AAA PRODUCTION GRADE
-- Matches Meridian Bay 2-Column Dashboard & Vector Street Map EXACTLY
-- Features:
-- 1. Default Screen: DashboardFrame (Left: Officer Duty & Profile, Right: Vector City Map)
-- 2. TopNavBar: 8 Tabs, Cash Display with Quick Shop (+), Duty Clock In/Out, Shift Timer, Settings/Lang
-- 3. 911 Call Answering Pipeline: IncomingCallModal with Dual-Tone Ring, Caller Transcript, 25s Countdown
-- 4. Queue Capacity System: Level-based + Cash Upgrades via '📋 0/5 +' CapPlusBtn
-- 5. Dynamic Vector Map Pins: Glowing pulsing markers on named streets, Click-to-Dispatch, Animated GPS Vehicle Driving
-- 6. Dynamic IncidentsFrame, Fleet Management, Cash Shop, Station Upgrades, City Radio, Rewards Modals

local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local TS = game:GetService("TweenService")
local SS = game:GetService("SoundService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local gui = player:WaitForChild("PlayerGui")
local ui = gui:WaitForChild("OverlordUI", 25)
if not ui then warn("[CM v9.0] OverlordUI not found!") return end

local RE = RS:WaitForChild("RemoteEvents", 15)
local RF = RS:WaitForChild("RemoteFunctions", 15)

-- Frames Registry
local FRAMES = {
	dashboard = "DashboardFrame",
	calls = "IncidentsFrame",
	chat = "CityChatFrame",
	units = "UnitManagementFrame",
	shop = "CashPackFrame",
	career = "StationUpgradeFrame",
	leaderboard = "ShiftManagementFrame",
	map = "TacticalMapFrame",
}

-- Audio Management
local sFolder = SS:FindFirstChild("OverlordSounds")
local function playSound(name)
	if sFolder then
		local s = sFolder:FindFirstChild(name)
		if s then
			s:Play()
			if name == "AlertSiren" then
				task.delay(3.5, function()
					if s.IsPlaying then s:Stop() end
				end)
			end
		end
	end
end

local isPhoneRinging = false
local function startPhoneRing()
	isPhoneRinging = true
	local beep = sFolder and sFolder:FindFirstChild("RadioBeep")
	if not beep then return end
	task.spawn(function()
		while isPhoneRinging do
			beep.PlaybackSpeed = 1.45
			beep:Play()
			task.wait(0.20)
			if not isPhoneRinging then break end
			beep.PlaybackSpeed = 1.80
			beep:Play()
			task.wait(0.75)
		end
		beep.PlaybackSpeed = 1.0
	end)
end

local function stopPhoneRing()
	isPhoneRinging = false
end

-- State
local currentLang = "TH"
local isOnDuty = false
local shiftStartTime = 0
local selCity = "Downtown"
local selShift = "Evening"
local activeCallId = nil
local toastIndex = 0
local sessionStartTime = os.time()
local isMapFullScreen = false
local recentResolvedList = {}

local pData = {
	cash = 29743,
	xp = 72000,
	level = 23,
	callsHandled = 1452,
	callsResolved = 1380,
	upgrades = {CALLS = 1, DISPATCH = 1},
	redeemedCodes = {},
	dailyStreak = 1,
	lastDailyClaim = 0,
	playtimeClaimed = {},
	ownedVehicles = {},
}

local activeIncidents = {}
local vectorPins = {}
local cachedUnits = {}
local enRouteUnits = {}
local onSceneUnits = {}
local chatOrder = 0

local SEV_COLORS = {
	Critical = Color3.fromRGB(235, 45, 45),
	High = Color3.fromRGB(245, 130, 20),
	Medium = Color3.fromRGB(240, 195, 30),
	Low = Color3.fromRGB(40, 180, 90),
}

local function getSevTag(sev)
	if sev == "Critical" then return "🚨 [CRITICAL]"
	elseif sev == "High" then return "⚠️ [HIGH]"
	elseif sev == "Medium" then return "🟡 [MEDIUM]"
	else return "🟢 [LOW]" end
end

local function getMaxQueue()
	local lvl = pData.level or 1
	local bonus = math.floor(lvl / 10)
	local trunkBonus = (pData.upgrades and pData.upgrades.CALLS) or 0
	return 2 + bonus + trunkBonus
end

local function getActiveIncidentCount()
	local c = 0
	for _, inc in pairs(activeIncidents) do
		if inc.status ~= "resolved" then c = c + 1 end
	end
	return c
end

local function pickBestUnit(dept)
	local fallback = nil
	for _, u in ipairs(cachedUnits) do
		if u.status == "available" and not enRouteUnits[u.id] and not onSceneUnits[u.id] then
			if u.dept == dept then return u.id end
			fallback = fallback or u.id
		end
	end
	return fallback or (cachedUnits[1] and cachedUnits[1].id) or "P-101"
end

-- ==========================================
-- TOAST NOTIFICATION SYSTEM
-- ==========================================
local function showToast(data)
	local toasts = ui:FindFirstChild("ToastsFolder")
	if not toasts then
		toasts = Instance.new("Folder")
		toasts.Name = "ToastsFolder"
		toasts.Parent = ui
	end

	toastIndex = toastIndex + 1
	local toast = Instance.new("Frame")
	toast.Name = "Toast_" .. toastIndex
	toast.Size = UDim2.new(0, 320, 0, 56)
	toast.Position = UDim2.new(1, 20, 0, 56 + (toastIndex % 4) * 62)
	toast.BackgroundColor3 = Color3.fromRGB(14, 18, 30)
	toast.ZIndex = 500
	toast.Parent = toasts

	local cor = Instance.new("UICorner", toast) cor.CornerRadius = UDim.new(0, 6)
	local str = Instance.new("UIStroke", toast) str.Thickness = 1.5

	local tc = {
		alert = Color3.fromRGB(255, 60, 60),
		success = Color3.fromRGB(40, 210, 100),
		info = Color3.fromRGB(74, 144, 217),
		shift = Color3.fromRGB(0, 220, 220),
		purchase = Color3.fromRGB(240, 180, 30),
		upgrade = Color3.fromRGB(160, 80, 255),
	}
	str.Color = tc[data.type] or Color3.fromRGB(74, 144, 217)

	local titleLbl = Instance.new("TextLabel", toast)
	titleLbl.Size = UDim2.new(1, -16, 0, 20)
	titleLbl.Position = UDim2.new(0, 10, 0, 6)
	titleLbl.BackgroundTransparency = 1
	titleLbl.Font = Enum.Font.GothamBold
	titleLbl.TextSize = 11
	titleLbl.TextColor3 = str.Color
	titleLbl.TextXAlignment = Enum.TextXAlignment.Left
	titleLbl.Text = data.title or "NOTIFICATION"
	titleLbl.ZIndex = 501

	local msgLbl = Instance.new("TextLabel", toast)
	msgLbl.Size = UDim2.new(1, -16, 0, 24)
	msgLbl.Position = UDim2.new(0, 10, 0, 26)
	msgLbl.BackgroundTransparency = 1
	msgLbl.Font = Enum.Font.Gotham
	msgLbl.TextSize = 10
	msgLbl.TextColor3 = Color3.fromRGB(200, 215, 235)
	msgLbl.TextXAlignment = Enum.TextXAlignment.Left
	msgLbl.TextWrapped = true
	msgLbl.Text = data.msg or ""
	msgLbl.ZIndex = 501

	TS:Create(toast, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(1, -330, 0, 56 + (toastIndex % 4) * 62)
	}):Play()

	task.delay(4.2, function()
		if toast and toast.Parent then
			local out = TS:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
				Position = UDim2.new(1, 20, 0, toast.Position.Y.Offset),
				BackgroundTransparency = 1,
			})
			out:Play()
			out.Completed:Connect(function() toast:Destroy() end)
		end
	end)
end

-- ==========================================
-- MODAL MANAGEMENT
-- ==========================================
local function closeModal(modalName)
	local m = ui:FindFirstChild(modalName)
	if m then
		m.Visible = false
		if modalName == "IncomingCallModal" then
			stopPhoneRing()
		end
		playSound("ButtonClick")
	end
end

local function openModal(modalName)
	for _, name in ipairs({"GiftCodeModal", "DailyRewardsModal", "PlaytimeRewardsModal", "IncomingCallModal"}) do
		local m = ui:FindFirstChild(name)
		if m then
			m.Visible = (name == modalName)
		end
	end
	playSound("ButtonClick")
end

-- ==========================================
-- SCREEN NAVIGATION SYSTEM
-- ==========================================
local renderIncidentsFrame -- forward declaration

local function hideAllFrames()
	for _, frameName in pairs(FRAMES) do
		local f = ui:FindFirstChild(frameName)
		if f then f.Visible = false end
	end
end

local function showFrame(targetKey)
	local targetName = FRAMES[targetKey]
	if not targetName then return end

	hideAllFrames()
	local target = ui:FindFirstChild(targetName)
	if target then
		target.Visible = true
		playSound("ButtonClick")
		if targetKey == "calls" and renderIncidentsFrame then
			renderIncidentsFrame()
		end
	end

	local nav = ui:FindFirstChild("TopNavBar")
	if nav then
		local bar = nav:FindFirstChild("TabsBar", true)
		if bar then
			for _, tab in ipairs(bar:GetChildren()) do
				if tab:IsA("TextButton") then
					local isActive = (tab.Name == "Tab_" .. targetKey)
					tab.BackgroundColor3 = isActive and Color3.fromRGB(24, 48, 92) or Color3.fromRGB(16, 22, 38)
					local stroke = tab:FindFirstChildWhichIsA("UIStroke")
					if stroke then
						stroke.Color = isActive and Color3.fromRGB(74, 144, 217) or Color3.fromRGB(35, 48, 75)
					end
				end
			end
		end
	end
end

-- ==========================================
-- DASHBOARD UI REFRESHERS (Profile, Map Pill, Radar)
-- ==========================================
local function updateCashDisplay()
	local nav = ui:FindFirstChild("TopNavBar")
	if nav then
		local lbl = nav:FindFirstChild("CashLabel", true)
		if lbl then
			lbl.Text = "💵 $" .. string.format("%d", pData.cash or 0)
		end
	end
end

local function updateMapPill()
	local df = ui:FindFirstChild("DashboardFrame")
	if not df then return end
	local mapPanel = df:FindFirstChild("VectorCityMapPanel")
	if not mapPanel then return end
	local pill = mapPanel:FindFirstChild("BottomMapPill")
	local pillText = pill and pill:FindFirstChild("PillText")
	if not pillText then return end

	local totalUnits = #cachedUnits > 0 and #cachedUnits or 31
	local enRouteCount = 0
	for _ in pairs(enRouteUnits) do enRouteCount = enRouteCount + 1 end
	local onSceneCount = 0
	for _ in pairs(onSceneUnits) do onSceneCount = onSceneCount + 1 end
	local availCount = math.max(0, totalUnits - enRouteCount - onSceneCount)

	pillText.Text = string.format("%d AVAIL • %d EN ROUTE • %d ON SCENE", availCount, enRouteCount, onSceneCount)
end

local function updateDutyStatusUI()
	local isTH = (currentLang == "TH")
	local df = ui:FindFirstChild("DashboardFrame")
	local dutyPanel = df and df:FindFirstChild("OfficerDutyPanel")
	local callout = dutyPanel and dutyPanel:FindFirstChild("DutyCalloutArea")

	local nav = ui:FindFirstChild("TopNavBar")
	local rc = nav and nav:FindFirstChild("RightControls")
	local navStartBtn = rc and rc:FindFirstChild("StartShiftBtn")
	local navTimerLbl = rc and rc:FindFirstChild("ShiftTimerLabel")

	if isOnDuty then
		if callout then
			local btn = callout:FindFirstChild("StartShiftActionBtn")
			if btn then
				btn.Text = isTH and "⏹ ออกกะ (CLOCK OUT)" or "⏹ CLOCK OUT"
				btn.BackgroundColor3 = Color3.fromRGB(180, 40, 40)
			end
			local title = callout:FindFirstChild("CityWaitingTitle")
			if title then title.Text = isTH and "กู้ภัยประจำการอยู่" or "DISPATCH ACTIVE" end
			local sub = callout:FindFirstChild("CityWaitingSub")
			if sub then sub.Text = isTH and "ระบบกำลังสแกนเหตุการณ์ 911 ทั่ว Meridian Bay" or "Monitoring 911 channels across Meridian Bay" end
		end
		if navStartBtn then
			navStartBtn.Text = isTH and "⏹ ออกกะ" or "⏹ Clock Out"
			navStartBtn.BackgroundColor3 = Color3.fromRGB(160, 36, 36)
		end
	else
		if callout then
			local btn = callout:FindFirstChild("StartShiftActionBtn")
			if btn then
				btn.Text = isTH and "▶ เริ่มกะงาน" or "▶ START SHIFT"
				btn.BackgroundColor3 = Color3.fromRGB(0, 180, 85)
			end
			local title = callout:FindFirstChild("CityWaitingTitle")
			if title then title.Text = isTH and "เมืองกำลังรอคุณอยู่" or "THE CITY IS WAITING" end
			local sub = callout:FindFirstChild("CityWaitingSub")
			if sub then sub.Text = isTH and "เริ่มกะของคุณเพื่อเปิดกระดานสดและเริ่มรับ 911 โทร" or "Start your shift to open the live board and take 911 calls" end
		end
		if navStartBtn then
			navStartBtn.Text = isTH and "เริ่มกะงาน" or "Start Shift"
			navStartBtn.BackgroundColor3 = Color3.fromRGB(0, 180, 85)
		end
		if navTimerLbl then
			navTimerLbl.Text = isTH and "● ปิดกะที่ 00:00" or "● OFF DUTY 00:00"
			navTimerLbl.TextColor3 = Color3.fromRGB(140, 160, 180)
		end
	end
end

local function updateOfficerProfileUI()
	local df = ui:FindFirstChild("DashboardFrame")
	if not df then return end
	local panel = df:FindFirstChild("OfficerDutyPanel")
	if not panel then return end

	-- 1. Profile Header
	local header = panel:FindFirstChild("ProfileHeader")
	if header then
		local nameLbl = header:FindFirstChild("OfficerNameLbl")
		if nameLbl then
			nameLbl.Text = player.DisplayName or player.Name
		end

		local rankLbl = header:FindFirstChild("OfficerRankLbl")
		if rankLbl then
			local lvl = pData.level or 23
			rankLbl.Text = (currentLang == "TH")
				and (lvl >= 20 and "หัวหน้าฝ่ายกะ" or (lvl >= 10 and "เจ้าหน้าที่อาวุโส" or "เจ้าหน้าที่ปฏิบัติการ"))
				or (lvl >= 20 and "Shift Supervisor" or (lvl >= 10 and "Senior Dispatcher" or "Operator"))
		end

		local avatarFrame = header:FindFirstChild("AvatarFrame")
		local avatarImg = avatarFrame and avatarFrame:FindFirstChild("AvatarImage")
		if avatarImg and not avatarImg:GetAttribute("Loaded") then
			task.spawn(function()
				local thumb, isReady = Players:GetUserThumbnailAsync(
					player.UserId,
					Enum.ThumbnailType.HeadShot,
					Enum.ThumbnailSize.Size150x150
				)
				if isReady and avatarImg and avatarImg.Parent then
					avatarImg.Image = thumb
					avatarImg:SetAttribute("Loaded", true)
				end
			end)
		end

		-- Capacity Badge: 📋 0/5 +
		local qBadge = header:FindFirstChild("QueueCapacityBadge")
		if qBadge then
			local curActive = getActiveIncidentCount()
			local maxQ = getMaxQueue()
			local capTxt = qBadge:FindFirstChild("CapacityText")
			if capTxt then
				capTxt.Text = "📋 " .. curActive .. "/" .. maxQ
				capTxt.TextColor3 = (curActive >= maxQ) and Color3.fromRGB(255, 75, 75) or Color3.fromRGB(230, 240, 255)
			end
			local plusBtn = qBadge:FindFirstChild("CapPlusBtn")
			if plusBtn then
				local callTier = (pData.upgrades and pData.upgrades.CALLS) or 0
				local cost = math.floor(2750 * (1.35 ^ callTier))
				plusBtn:SetAttribute("Cost", cost)
			end
		end

		-- Level progress bar
		local lvlStrip = header:FindFirstChild("LevelStrip")
		if lvlStrip then
			local lvlTag = lvlStrip:FindFirstChild("LevelTag")
			if lvlTag then lvlTag.Text = "LVL " .. (pData.level or 23) end

			local barBg = lvlStrip:FindFirstChild("BarBg")
			local barFill = barBg and barBg:FindFirstChild("BarFill")
			local xpText = lvlStrip:FindFirstChild("XpText")

			local currentXP = pData.xp or 72000
			local xpInTier = currentXP % 10000
			local pct = math.clamp(xpInTier / 10000, 0.05, 1)

			if barFill then
				TS:Create(barFill, TweenInfo.new(0.4), {Size = UDim2.new(pct, 0, 1, 0)}):Play()
			end
			if xpText then
				xpText.Text = string.format("%d%% • %d / 10,000 XP", math.floor(pct * 100), xpInTier)
			end
		end
	end

	-- 2. Callout Strip
	local callout = panel:FindFirstChild("DutyCalloutArea")
	if callout then
		local goalStrip = callout:FindFirstChild("NextGoalStrip")
		if goalStrip then
			goalStrip.Text = "เป้าหมายถัดไป • ปลดล็อค NORTH RIDGE • $" .. string.format("%d", pData.cash or 29743) .. " / $42,500"
		end
	end

	-- 3. Lifetime Stats Strip
	local statsStrip = panel:FindFirstChild("LifetimeStatsStrip")
	if statsStrip then
		local handled = pData.callsHandled or 1452
		local resolved = pData.callsResolved or 1380
		local eff = (handled > 0) and math.floor((resolved / handled) * 100) or 94
		statsStrip.Text = string.format("%d LIFETIME CALLS • %d INCIDENTS RESOLVED • %d%% EFFICIENCY", handled, resolved, eff)
	end

	updateDutyStatusUI()
	updateMapPill()
	updateCashDisplay()
end

local function syncFullProfile(data)
	if not data then return end
	pData = data
	updateOfficerProfileUI()
	if renderIncidentsFrame then renderIncidentsFrame() end
end

-- ==========================================
-- VECTOR CITY MAP PINS & REAL-TIME DRIVING
-- ==========================================
local function addIncidentToVectorMap(inc)
	local df = ui:FindFirstChild("DashboardFrame")
	if not df then return end
	local mapPanel = df:FindFirstChild("VectorCityMapPanel")
	if not mapPanel then return end
	local container = mapPanel:FindFirstChild("IncidentMarkersContainer")
	if not container then return end

	local existing = container:FindFirstChild("VecPin_" .. inc.id)
	if existing then existing:Destroy() end

	local pin = Instance.new("Frame")
	pin.Name = "VecPin_" .. inc.id
	pin.Size = UDim2.new(0, 26, 0, 26)
	pin.Position = UDim2.new(inc.mx or 0.55, -13, inc.my or 0.46, -13)
	pin.BackgroundColor3 = SEV_COLORS[inc.severity] or Color3.fromRGB(235, 45, 45)
	pin.ZIndex = 18
	pin.Parent = container

	local pinCorner = Instance.new("UICorner", pin)
	pinCorner.CornerRadius = UDim.new(1, 0)
	local pinStroke = Instance.new("UIStroke", pin)
	pinStroke.Thickness = 2
	pinStroke.Color = Color3.fromRGB(255, 255, 255)

	-- Concentric Pulsing Ring
	local pulseRing = Instance.new("Frame", pin)
	pulseRing.Size = UDim2.new(1, 0, 1, 0)
	pulseRing.Position = UDim2.new(0, 0, 0, 0)
	pulseRing.BackgroundTransparency = 0.35
	pulseRing.BackgroundColor3 = pin.BackgroundColor3
	pulseRing.ZIndex = 17
	Instance.new("UICorner", pulseRing).CornerRadius = UDim.new(1, 0)

	TS:Create(pulseRing, TweenInfo.new(1.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, -1), {
		Size = UDim2.new(2.4, 0, 2.4, 0),
		Position = UDim2.new(-0.7, 0, -0.7, 0),
		BackgroundTransparency = 1,
	}):Play()

	-- Icon
	local iconLbl = Instance.new("TextLabel", pin)
	iconLbl.Size = UDim2.new(1, 0, 1, 0)
	iconLbl.BackgroundTransparency = 1
	iconLbl.Text = (inc.dept == "Fire" and "🔥") or (inc.dept == "Police" and "🚔") or "🚑"
	iconLbl.TextSize = 12
	iconLbl.ZIndex = 19

	-- Click to Auto-Dispatch
	local clickBtn = Instance.new("TextButton", pin)
	clickBtn.Size = UDim2.new(1, 0, 1, 0)
	clickBtn.BackgroundTransparency = 1
	clickBtn.Text = ""
	clickBtn.ZIndex = 20
	clickBtn.MouseButton1Click:Connect(function()
		local bestUnit = pickBestUnit(inc.dept)
		RE.DispatchUnit:FireServer(bestUnit, inc.id)
		playSound("RadioBeep")
		showToast({type = "info", title = "⚡ DISPATCH SENT", msg = "Unit " .. bestUnit .. " responding to " .. (inc.title or inc.id)})
	end)

	vectorPins[inc.id] = pin
	updateOfficerProfileUI()
end

local function removeIncidentFromVectorMap(incId)
	local pin = vectorPins[incId]
	if pin and pin.Parent then
		TS:Create(pin, TweenInfo.new(0.35), {Size = UDim2.new(0, 0, 0, 0), BackgroundTransparency = 1}):Play()
		task.delay(0.35, function() pin:Destroy() end)
		vectorPins[incId] = nil
	end
	enRouteUnits[incId] = nil
	onSceneUnits[incId] = nil
	updateOfficerProfileUI()
end

local function animateVectorUnitDispatch(unitId, inc)
	local df = ui:FindFirstChild("DashboardFrame")
	if not df then return end
	local mapPanel = df:FindFirstChild("VectorCityMapPanel")
	if not mapPanel then return end
	local dotsContainer = mapPanel:FindFirstChild("UnitDotsContainer")
	if not dotsContainer then return end

	-- City / Station Origins
	local stationCoords = {
		Downtown = {x = 0.55, y = 0.46},
		Westvale = {x = 0.16, y = 0.28},
		NorthRidge = {x = 0.68, y = 0.16},
		Southgate = {x = 0.55, y = 0.76},
		Oakhaven = {x = 0.33, y = 0.50},
	}
	local origin = stationCoords[inc.city] or {x = 0.55, y = 0.46}
	local target = {x = inc.mx or 0.55, y = inc.my or 0.46}

	local isChopper = (tostring(unitId):find("^H%-") ~= nil)

	local blip = Instance.new("Frame")
	blip.Name = "GPSDot_" .. tostring(unitId)
	blip.Size = isChopper and UDim2.new(0, 22, 0, 22) or UDim2.new(0, 16, 0, 16)
	blip.Position = UDim2.new(origin.x, -8, origin.y, -8)
	blip.BackgroundColor3 = isChopper and Color3.fromRGB(0, 230, 255)
		or ((inc.dept == "Fire" and Color3.fromRGB(255, 60, 60)) or (inc.dept == "Police" and Color3.fromRGB(0, 200, 255)) or Color3.fromRGB(40, 220, 100))
	blip.ZIndex = 25
	blip.Parent = dotsContainer

	Instance.new("UICorner", blip).CornerRadius = UDim.new(1, 0)
	local bStroke = Instance.new("UIStroke", blip)
	bStroke.Thickness = 2
	bStroke.Color = Color3.fromRGB(255, 255, 255)

	local iconLbl = Instance.new("TextLabel", blip)
	iconLbl.Size = UDim2.new(1, 0, 1, 0)
	iconLbl.BackgroundTransparency = 1
	iconLbl.Text = isChopper and "🚁" or ((inc.dept == "Fire" and "🚒") or (inc.dept == "Police" and "🚔") or "🚑")
	iconLbl.TextSize = isChopper and 13 or 10

	enRouteUnits[unitId] = true
	updateMapPill()

	local duration = isChopper and 2.4 or 3.6
	local driveTween = TS:Create(blip, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut), {
		Position = UDim2.new(target.x, -8, target.y, -8)
	})
	driveTween:Play()
	playSound("RadioBeep")

	driveTween.Completed:Connect(function()
		enRouteUnits[unitId] = nil
		onSceneUnits[unitId] = true
		updateMapPill()

		-- Siren Flash on scene
		local flash = TS:Create(blip, TweenInfo.new(0.4, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, 5, true), {
			BackgroundTransparency = 0.8
		})
		flash:Play()
		flash.Completed:Connect(function()
			if blip and blip.Parent then blip:Destroy() end
			onSceneUnits[unitId] = nil
			updateMapPill()
		end)
	end)
end

-- ==========================================
-- DYNAMIC INCIDENTS FRAME (Calls Screen)
-- ==========================================
renderIncidentsFrame = function()
	local inf = ui:FindFirstChild("IncidentsFrame")
	if not inf then return end
	local scroll = inf:FindFirstChild("IncidentListScroll")
	if not scroll then return end

	for _, c in ipairs(scroll:GetChildren()) do
		if c:IsA("Frame") then c:Destroy() end
	end

	local activeList = {}
	for _, inc in pairs(activeIncidents) do
		if inc.status ~= "resolved" then
			table.insert(activeList, inc)
		end
	end

	local isTH = (currentLang == "TH")

	for i, inc in ipairs(activeList) do
		local card = Instance.new("Frame")
		card.Name = "RealICard_" .. inc.id
		card.Size = UDim2.new(1, -8, 0, 105)
		card.BackgroundColor3 = Color3.fromRGB(16, 22, 36)
		card.LayoutOrder = i
		card.Parent = scroll

		Instance.new("UICorner", card).CornerRadius = UDim.new(0, 6)
		local stroke = Instance.new("UIStroke", card)
		stroke.Thickness = 1.5
		stroke.Color = SEV_COLORS[inc.severity] or Color3.fromRGB(235, 45, 45)

		-- Top Bar
		local topBar = Instance.new("Frame", card)
		topBar.Size = UDim2.new(1, 0, 0, 26)
		topBar.BackgroundTransparency = 1

		local idLbl = Instance.new("TextLabel", topBar)
		idLbl.Size = UDim2.new(0, 90, 1, 0)
		idLbl.Position = UDim2.new(0, 10, 0, 0)
		idLbl.BackgroundTransparency = 1
		idLbl.Font = Enum.Font.GothamBold
		idLbl.TextSize = 11
		idLbl.TextColor3 = stroke.Color
		idLbl.TextXAlignment = Enum.TextXAlignment.Left
		idLbl.Text = inc.id

		local statusBadge = Instance.new("TextLabel", topBar)
		statusBadge.Size = UDim2.new(0, 100, 0, 20)
		statusBadge.Position = UDim2.new(1, -110, 0, 3)
		statusBadge.BackgroundColor3 = (inc.status == "responding") and Color3.fromRGB(160, 90, 20) or Color3.fromRGB(24, 110, 48)
		statusBadge.Font = Enum.Font.GothamBold
		statusBadge.TextSize = 9
		statusBadge.TextColor3 = Color3.fromRGB(255, 255, 255)
		statusBadge.Text = (inc.status == "responding") and (isTH and "กำลังไป" or "RESPONDING") or (isTH and "รอดำเนินการ" or "PENDING")
		Instance.new("UICorner", statusBadge).CornerRadius = UDim.new(0, 4)

		-- Middle
		local titleLbl = Instance.new("TextLabel", card)
		titleLbl.Size = UDim2.new(1, -20, 0, 20)
		titleLbl.Position = UDim2.new(0, 10, 0, 26)
		titleLbl.BackgroundTransparency = 1
		titleLbl.Font = Enum.Font.GothamBold
		titleLbl.TextSize = 12
		titleLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
		titleLbl.TextXAlignment = Enum.TextXAlignment.Left
		titleLbl.Text = (inc.dept == "Fire" and "🔥 " or (inc.dept == "Police" and "🚔 " or "🚑 ")) .. (inc.title or inc.type)

		local locLbl = Instance.new("TextLabel", card)
		locLbl.Size = UDim2.new(1, -20, 0, 16)
		locLbl.Position = UDim2.new(0, 10, 0, 46)
		locLbl.BackgroundTransparency = 1
		locLbl.Font = Enum.Font.Gotham
		locLbl.TextSize = 10
		locLbl.TextColor3 = Color3.fromRGB(140, 170, 205)
		locLbl.TextXAlignment = Enum.TextXAlignment.Left
		locLbl.Text = "📍 " .. (inc.cityName or inc.city) .. " • " .. (inc.req or "Units") .. " • 💵 +$" .. (inc.rewardCash or 1000)

		-- Action Buttons
		local btnDispatch = Instance.new("TextButton", card)
		btnDispatch.Size = UDim2.new(0, 100, 0, 26)
		btnDispatch.Position = UDim2.new(0, 10, 0, 68)
		btnDispatch.BackgroundColor3 = Color3.fromRGB(24, 110, 48)
		btnDispatch.Font = Enum.Font.GothamBold
		btnDispatch.TextSize = 10
		btnDispatch.TextColor3 = Color3.fromRGB(255, 255, 255)
		btnDispatch.Text = isTH and "⚡ ส่งหน่วย" or "⚡ Dispatch"
		Instance.new("UICorner", btnDispatch).CornerRadius = UDim.new(0, 4)
		btnDispatch.MouseButton1Click:Connect(function()
			local best = pickBestUnit(inc.dept)
			RE.DispatchUnit:FireServer(best, inc.id)
			btnDispatch.Text = isTH and "สั่งการแล้ว" or "Dispatched"
			btnDispatch.BackgroundColor3 = Color3.fromRGB(140, 80, 20)
			playSound("RadioBeep")
		end)

		local btnPrank = Instance.new("TextButton", card)
		btnPrank.Size = UDim2.new(0, 100, 0, 26)
		btnPrank.Position = UDim2.new(0, 118, 0, 68)
		btnPrank.BackgroundColor3 = Color3.fromRGB(160, 90, 20)
		btnPrank.Font = Enum.Font.GothamBold
		btnPrank.TextSize = 10
		btnPrank.TextColor3 = Color3.fromRGB(255, 255, 255)
		btnPrank.Text = isTH and "⚠️ ตรวจสายกวน" or "⚠️ Check Prank"
		Instance.new("UICorner", btnPrank).CornerRadius = UDim.new(0, 4)
		btnPrank.MouseButton1Click:Connect(function()
			RE.MarkPrank:FireServer(inc.id, true)
			playSound("ButtonClick")
		end)

		local btnResolve = Instance.new("TextButton", card)
		btnResolve.Size = UDim2.new(0, 100, 0, 26)
		btnResolve.Position = UDim2.new(0, 226, 0, 68)
		btnResolve.BackgroundColor3 = Color3.fromRGB(40, 50, 75)
		btnResolve.Font = Enum.Font.GothamBold
		btnResolve.TextSize = 10
		btnResolve.TextColor3 = Color3.fromRGB(200, 220, 255)
		btnResolve.Text = isTH and "✅ ปิดงานสำเร็จ" or "✅ Resolve"
		Instance.new("UICorner", btnResolve).CornerRadius = UDim.new(0, 4)
		btnResolve.MouseButton1Click:Connect(function()
			RE.IncidentUpdate:FireServer(inc.id, "resolved")
			playSound("CashReward")
		end)
	end

	scroll.CanvasSize = UDim2.new(0, 0, 0, #activeList * 115)
end

-- ==========================================
-- INCOMING 911 CALL MODAL PIPELINE
-- ==========================================
local function showIncoming911CallModal(callData, curActive, maxQ)
	activeCallId = callData.id
	local modal = ui:FindFirstChild("IncomingCallModal")
	if not modal then return end

	local callerLbl = modal:FindFirstChild("CallerLbl", true)
	if callerLbl then
		callerLbl.Text = "📞 ผู้แจ้ง: " .. (callData.caller or "พลเมือง") .. " • " .. (callData.cityName or callData.city)
	end

	local sevBadge = modal:FindFirstChild("SevBadge", true)
	if sevBadge then
		sevBadge.Text = getSevTag(callData.severity)
		sevBadge.BackgroundColor3 = SEV_COLORS[callData.severity] or Color3.fromRGB(235, 45, 45)
	end

	local titleLbl = modal:FindFirstChild("IncidentTitleLbl", true)
	if titleLbl then
		titleLbl.Text = (callData.dept == "Fire" and "🔥 " or (callData.dept == "Police" and "🚨 " or "🚑 ")) .. (callData.title or callData.type)
	end

	local transLbl = modal:FindFirstChild("TranscriptLbl", true)
	if transLbl then
		transLbl.Text = string.format("\"%s\"", tostring(callData.transcript or callData.desc or "ฉุกเฉิน ขอความช่วยเหลือด่วน!"))
	end

	local reqLbl = modal:FindFirstChild("ReqLbl", true)
	if reqLbl then
		reqLbl.Text = "🚒 ต้องการ: " .. (callData.req or "Units") .. " | รางวัล: +$" .. (callData.rewardCash or 1000) .. ", +" .. (callData.rewardXP or 1200) .. " XP"
	end

	local qNotice = modal:FindFirstChild("QueueNotice", true)
	if qNotice then
		local isFull = (curActive >= maxQ)
		qNotice.Text = (currentLang == "TH")
			and (isFull and ("⚠️ คิวรับสายเต็ม! " .. curActive .. " / " .. maxQ .. " (ต้องรอคิวหรืออัปเกรดคู่สาย)") or ("📞 คิวรับสายปัจจุบัน: " .. curActive .. " / " .. maxQ .. " ช่องคู่สาย"))
			or (isFull and ("⚠️ Queue Full! " .. curActive .. " / " .. maxQ .. " (Waiting)") or ("📞 Current Queue: " .. curActive .. " / " .. maxQ .. " Slots"))
		qNotice.TextColor3 = isFull and Color3.fromRGB(255, 75, 75) or Color3.fromRGB(160, 210, 255)
	end

	modal.Visible = true
	startPhoneRing()

	-- 25-Second countdown timer
	task.spawn(function()
		local timerLbl = modal:FindFirstChild("TimerLbl", true)
		for rem = 25, 0, -1 do
			if not modal.Visible or activeCallId ~= callData.id then break end
			if timerLbl then timerLbl.Text = "⏱️ ถือสายรอ " .. rem .. "s" end
			task.wait(1)
		end
		if modal.Visible and activeCallId == callData.id then
			modal.Visible = false
			stopPhoneRing()
			showToast({type = "alert", title = "สายหลุด (MISSED CALL)", msg = "ผู้แจ้งเหตุวางสายเนื่องจากรอนานเกินไป"})
		end
	end)
end

-- ==========================================
-- WIRING TOP NAVBAR & DASHBOARD CONTROLS
-- ==========================================
local function wireTopNavBarAndDashboard()
	local nav = ui:FindFirstChild("TopNavBar")
	if nav then
		-- Tabs
		local bar = nav:FindFirstChild("TabsBar", true)
		if bar then
			local tabMap = {
				Tab_dashboard = "dashboard",
				Tab_calls = "calls",
				Tab_chat = "chat",
				Tab_units = "units",
				Tab_shop = "shop",
				Tab_career = "career",
				Tab_leaderboard = "leaderboard",
			}
			for tabBtnName, frameKey in pairs(tabMap) do
				local btn = bar:FindFirstChild(tabBtnName)
				if btn and btn:IsA("TextButton") then
					btn.MouseButton1Click:Connect(function()
						showFrame(frameKey)
					end)
				end
			end

			local rewTab = bar:FindFirstChild("Tab_rewards")
			if rewTab and rewTab:IsA("TextButton") then
				rewTab.MouseButton1Click:Connect(function()
					openModal("DailyRewardsModal")
				end)
			end
		end

		-- Right Controls
		local rc = nav:FindFirstChild("RightControls")
		if rc then
			-- Cash + button opens Shop
			local cashBadge = rc:FindFirstChild("CashBadge")
			if cashBadge then
				local plusBtn = cashBadge:FindFirstChild("CashPlusBtn") or cashBadge:FindFirstChildWhichIsA("TextButton")
				if plusBtn then
					plusBtn.MouseButton1Click:Connect(function()
						showFrame("shop")
					end)
				end
			end

			-- Start Shift Button in Nav
			local navShiftBtn = rc:FindFirstChild("StartShiftBtn")
			if navShiftBtn then
				navShiftBtn.MouseButton1Click:Connect(function()
					isOnDuty = not isOnDuty
					if isOnDuty then shiftStartTime = os.time() end
					updateDutyStatusUI()
					playSound("ButtonClick")
					RE.ShiftChange:FireServer(isOnDuty and "clockIn" or "clockOut", selCity, selShift)
				end)
			end

			-- Settings Button toggles Language
			local setBtn = rc:FindFirstChild("SettingsBtn")
			if setBtn then
				setBtn.MouseButton1Click:Connect(function()
					currentLang = (currentLang == "TH") and "EN" or "TH"
					updateOfficerProfileUI()
					playSound("ButtonClick")
					showToast({type = "info", title = "LANGUAGE CHANGED", msg = "Current language: " .. currentLang})
				end)
			end
		end
	end

	-- Dashboard Left Column: OfficerDutyPanel
	local df = ui:FindFirstChild("DashboardFrame")
	if df then
		local dutyPanel = df:FindFirstChild("OfficerDutyPanel")
		if dutyPanel then
			-- CapPlusBtn quick upgrade
			local plusBtn = dutyPanel:FindFirstChild("CapPlusBtn", true)
			if plusBtn then
				plusBtn.MouseButton1Click:Connect(function()
					local callTier = (pData.upgrades and pData.upgrades.CALLS) or 0
					local cost = math.floor(2750 * (1.35 ^ callTier))
					if pData.cash >= cost then
						RE.UpgradeStation:FireServer("CALLS")
						playSound("CashReward")
						showToast({type = "upgrade", title = "⚡ TRUNK LINE EXPANDED", msg = "+1 911 Queue Capacity Slot!"})
					else
						playSound("ButtonClick")
						showToast({type = "error", title = "⚠️ INSUFFICIENT FUNDS", msg = "Need $" .. cost .. " to upgrade 911 Trunk Lines!"})
					end
				end)
			end

			-- Start Shift Action Button in Duty Callout Area
			local actionBtn = dutyPanel:FindFirstChild("StartShiftActionBtn", true)
			if actionBtn then
				actionBtn.MouseButton1Click:Connect(function()
					isOnDuty = not isOnDuty
					if isOnDuty then shiftStartTime = os.time() end
					updateDutyStatusUI()
					playSound("ButtonClick")
					RE.ShiftChange:FireServer(isOnDuty and "clockIn" or "clockOut", selCity, selShift)
				end)
			end

			-- Concentric Radar Rings Pulsing Tween
			local callout = dutyPanel:FindFirstChild("DutyCalloutArea")
			if callout then
				local rings = {callout:FindFirstChild("RingOuter"), callout:FindFirstChild("RingMid"), callout:FindFirstChild("RingInner")}
				for idx, ring in ipairs(rings) do
					if ring then
						task.spawn(function()
							local baseSize = ring.Size
							while ring and ring.Parent do
								local t1 = TS:Create(ring, TweenInfo.new(1.2 + idx * 0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
									Size = UDim2.new(baseSize.X.Scale, baseSize.X.Offset + 8, baseSize.Y.Scale, baseSize.Y.Offset + 8),
									BackgroundTransparency = 0.85,
								})
								t1:Play()
								t1.Completed:Wait()
								local t2 = TS:Create(ring, TweenInfo.new(1.2 + idx * 0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
									Size = baseSize,
									BackgroundTransparency = 0.96,
								})
								t2:Play()
								t2.Completed:Wait()
							end
						end)
					end
				end
			end
		end

		-- Dashboard Right Column: VectorCityMapPanel Fullscreen toggle
		local mapPanel = df:FindFirstChild("VectorCityMapPanel")
		if mapPanel then
			local fsBtn = mapPanel:FindFirstChild("FullScreenBtn", true)
			if fsBtn then
				fsBtn.MouseButton1Click:Connect(function()
					isMapFullScreen = not isMapFullScreen
					if isMapFullScreen then
						if dutyPanel then dutyPanel.Visible = false end
						mapPanel.Size = UDim2.new(1, 0, 1, 0)
						mapPanel.Position = UDim2.new(0, 0, 0, 0)
						fsBtn.Text = "🗗 ย่อ"
					else
						if dutyPanel then dutyPanel.Visible = true end
						mapPanel.Size = UDim2.new(0.69, -4, 1, 0)
						mapPanel.Position = UDim2.new(0.31, 4, 0, 0)
						fsBtn.Text = "เต็ม"
					end
					playSound("ButtonClick")
				end)
			end
		end
	end
end

-- ==========================================
-- WIRING INCOMING CALL MODAL BUTTONS
-- ==========================================
local function wireIncomingCallModal()
	local callModal = ui:FindFirstChild("IncomingCallModal")
	if not callModal then return end

	local ansBtn = callModal:FindFirstChild("AnswerCallBtn", true)
	if ansBtn then
		ansBtn.MouseButton1Click:Connect(function()
			if activeCallId then
				stopPhoneRing()
				callModal.Visible = false
				RE.Answer911Call:FireServer(activeCallId)
				playSound("RadioBeep")
			end
		end)
	end

	local prankBtn = callModal:FindFirstChild("PrankCallBtn", true)
	if prankBtn then
		prankBtn.MouseButton1Click:Connect(function()
			if activeCallId then
				stopPhoneRing()
				callModal.Visible = false
				RE.Reject911Call:FireServer(activeCallId, true)
				playSound("ButtonClick")
				showToast({type = "alert", title = "⚠️ PRANK SCREENED", msg = "Caller flagged and call terminated."})
			end
		end)
	end

	local dismBtn = callModal:FindFirstChild("DismissCallBtn", true)
	if dismBtn then
		dismBtn.MouseButton1Click:Connect(function()
			if activeCallId then
				stopPhoneRing()
				callModal.Visible = false
				RE.Reject911Call:FireServer(activeCallId, false)
				playSound("ButtonClick")
				showToast({type = "info", title = "CALL DISMISSED", msg = "Incident routed to standby queue."})
			end
		end)
	end
end

-- ==========================================
-- WIRING REWARD MODALS (Codes, Daily, Playtime)
-- ==========================================
local function wireRewardModals()
	-- 1. Gift Codes
	local gcModal = ui:FindFirstChild("GiftCodeModal")
	if gcModal then
		local closeBtn = gcModal:FindFirstChild("CloseBtn", true)
		if closeBtn then closeBtn.MouseButton1Click:Connect(function() closeModal("GiftCodeModal") end) end

		local codeInput = gcModal:FindFirstChild("CodeInput", true)
		local redeemBtn = gcModal:FindFirstChild("RedeemBtn", true)
		if redeemBtn and codeInput then
			redeemBtn.MouseButton1Click:Connect(function()
				local raw = codeInput.Text
				if raw and #raw > 0 then
					RE.RedeemCode:FireServer(raw)
					playSound("ButtonClick")
				end
			end)
		end
	end

	-- 2. Daily Rewards
	local drModal = ui:FindFirstChild("DailyRewardsModal")
	if drModal then
		local closeBtn = drModal:FindFirstChild("CloseBtn", true)
		if closeBtn then closeBtn.MouseButton1Click:Connect(function() closeModal("DailyRewardsModal") end) end

		local claimBtn = drModal:FindFirstChild("ClaimDailyBtn", true)
		if claimBtn then
			claimBtn.MouseButton1Click:Connect(function()
				RE.ClaimDailyReward:FireServer()
				playSound("ButtonClick")
			end)
		end
	end

	-- 3. Playtime Rewards
	local prModal = ui:FindFirstChild("PlaytimeRewardsModal")
	if prModal then
		local closeBtn = prModal:FindFirstChild("CloseBtn", true)
		if closeBtn then closeBtn.MouseButton1Click:Connect(function() closeModal("PlaytimeRewardsModal") end) end

		local ptScroll = prModal:FindFirstChild("PlaytimeScroll", true)
		if ptScroll then
			for tierIdx = 1, 5 do
				local tierFrame = ptScroll:FindFirstChild("PlayTier_" .. tierIdx)
				local claimBtn = tierFrame and tierFrame:FindFirstChild("ClaimTierBtn", true)
				if claimBtn then
					claimBtn.MouseButton1Click:Connect(function()
						RE.ClaimPlaytimeReward:FireServer(tierIdx)
						playSound("ButtonClick")
					end)
				end
			end
		end
	end
end

-- ==========================================
-- WIRING FLEET, SHOP, AND RADIO
-- ==========================================
local function wireFleetShopAndChat()
	-- Fleet Unit Management
	local uf = ui:FindFirstChild("UnitManagementFrame")
	if uf then
		for _, b in ipairs(uf:GetDescendants()) do
			if b:IsA("TextButton") then
				local uId = b:GetAttribute("UnitId") or (b.Parent and b.Parent.Name:find("UCard_") and b.Parent.Name:gsub("UCard_", ""))
				local cost = b:GetAttribute("Cost")
				if b.Name == "DispatchBtn" or b.Text:find("Dispatch") or b.Text:find("ส่งหน่วย") or b.Text:find("🛒") then
					b.MouseButton1Click:Connect(function()
						local targetUnit = uId or "P-101"
						if cost and not (pData.ownedVehicles and pData.ownedVehicles[targetUnit]) then
							RE.BuyVehicle:FireServer(targetUnit)
							playSound("CashReward")
						else
							RE.DispatchUnit:FireServer(targetUnit, "MANUAL")
							playSound("RadioBeep")
							b.Text = (currentLang == "TH") and "กำลังไป..." or "En Route"
						end
					end)
				end
			end
		end
	end

	-- Cash Shop
	local cpf = ui:FindFirstChild("CashPackFrame")
	if cpf then
		local packKeys = {"MINI", "SMALL", "SMALL_PLUS", "MEDIUM", "LARGE", "MEGA"}
		local pIdx = 1
		for _, b in ipairs(cpf:GetDescendants()) do
			if b:IsA("TextButton") and (b.Text:find("ซื้อ") or b.Text:find("BUY")) then
				local pKey = packKeys[pIdx] or "MINI"
				pIdx = pIdx + 1
				b.MouseButton1Click:Connect(function()
					RE.BuyItem:FireServer(pKey)
					playSound("CashReward")
				end)
			end
		end
	end

	-- Station Upgrades
	local suf = ui:FindFirstChild("StationUpgradeFrame")
	if suf then
		local upgKeys = {"DISPATCH", "CALLS", "RADIO", "TRAINING"}
		local uIdx = 1
		for _, b in ipairs(suf:GetDescendants()) do
			if b:IsA("TextButton") and (b.Text:find("ซื้อ") or b.Text:find("Upgrade") or b.Text:find("$")) then
				local uKey = upgKeys[uIdx] or "DISPATCH"
				uIdx = uIdx + 1
				b.MouseButton1Click:Connect(function()
					RE.UpgradeStation:FireServer(uKey)
					playSound("CashReward")
				end)
			end
		end
	end

	-- City Radio / Chat
	local chatF = ui:FindFirstChild("CityChatFrame")
	if chatF then
		local input = chatF:FindFirstChildWhichIsA("TextBox", true)
		local sendBtn = chatF:FindFirstChild("SendButton", true) or chatF:FindFirstChild("SendBtn", true)

		local function doSend()
			if input and input.Text and #input.Text > 0 then
				local text = input.Text
				input.Text = ""
				RE.CityChat:FireServer(selCity, text, "normal")
				playSound("RadioBeep")
			end
		end

		if sendBtn then sendBtn.MouseButton1Click:Connect(doSend) end
		if input then input.FocusLost:Connect(function(enter) if enter then doSend() end end) end
	end
end

-- ==========================================
-- LIVE TIMERS & CLOCK TICKER
-- ==========================================
local function startLiveTickers()
	task.spawn(function()
		while true do
			task.wait(1)
			-- Clock Circle in Officer Duty Panel
			local df = ui:FindFirstChild("DashboardFrame")
			local dutyPanel = df and df:FindFirstChild("OfficerDutyPanel")
			local callout = dutyPanel and dutyPanel:FindFirstChild("DutyCalloutArea")
			local clockCircle = callout and callout:FindFirstChild("ClockCircle")
			local clockIcon = clockCircle and clockCircle:FindFirstChild("ClockIcon")
			if clockIcon then
				clockIcon.Text = os.date("%H:%M")
			end

			-- Shift timer in TopNavBar
			local nav = ui:FindFirstChild("TopNavBar")
			local rc = nav and nav:FindFirstChild("RightControls")
			local timerLbl = rc and rc:FindFirstChild("ShiftTimerLabel")
			if timerLbl and isOnDuty and shiftStartTime > 0 then
				local dur = os.time() - shiftStartTime
				local m = math.floor(dur / 60)
				local s = dur % 60
				timerLbl.Text = string.format("● ปฏิบัติหน้าที่ %02d:%02d", m, s)
				timerLbl.TextColor3 = Color3.fromRGB(0, 240, 120)
			end
		end
	end)
end

-- ==========================================
-- REMOTE EVENT LISTENERS
-- ==========================================
RE.SyncPlayerData.OnClientEvent:Connect(function(data)
	syncFullProfile(data)
end)

RE.AlertBroadcast.OnClientEvent:Connect(function(data)
	showToast(data)
end)

-- Incoming 911 Call arrives: RINGS first! Player must answer in modal!
RE.Incoming911Call.OnClientEvent:Connect(function(callData, curActive, maxQ)
	showIncoming911CallModal(callData, curActive, maxQ)
end)

-- Call accepted by dispatcher: logged onto Vector Map & IncidentsFrame!
RE.CallIncoming.OnClientEvent:Connect(function(inc)
	activeIncidents[inc.id] = inc
	addIncidentToVectorMap(inc)
	playSound("AlertSiren")

	local sevTag = getSevTag(inc.severity)
	showToast({
		type = "alert",
		title = sevTag .. " " .. (inc.title or inc.type):upper(),
		msg = (inc.city or "City") .. " • " .. (inc.desc or "Emergency dispatched"),
	})

	if renderIncidentsFrame then renderIncidentsFrame() end
end)

RE.IncidentUpdate.OnClientEvent:Connect(function(incId, status, unitId)
	if status == "resolved" then
		removeIncidentFromVectorMap(incId)
		playSound("CashReward")
		table.insert(recentResolvedList, 1, incId .. " • " .. os.date("%H:%M") .. " Resolved")
		if #recentResolvedList > 6 then table.remove(recentResolvedList) end
	elseif status == "responding" then
		if activeIncidents[incId] then
			activeIncidents[incId].status = "responding"
			if unitId then
				animateVectorUnitDispatch(unitId, activeIncidents[incId])
			end
		end
	end
	updateOfficerProfileUI()
	if renderIncidentsFrame then renderIncidentsFrame() end
end)

RE.CityChat.OnClientEvent:Connect(function(data)
	local chatF = ui:FindFirstChild("CityChatFrame")
	if not chatF then return end
	local scroll = chatF:FindFirstChild("ChatScrollFrame", true)
	if not scroll then return end

	chatOrder = chatOrder + 1
	local row = Instance.new("Frame")
	row.Size = UDim2.new(1, -8, 0, 42)
	row.BackgroundColor3 = Color3.fromRGB(16, 22, 38)
	row.BorderSizePixel = 0
	row.LayoutOrder = chatOrder
	row.Parent = scroll

	Instance.new("UICorner", row).CornerRadius = UDim.new(0, 4)

	local tc = {
		mutual_aid = Color3.fromRGB(240, 180, 30),
		alert = Color3.fromRGB(255, 70, 70),
		recall = Color3.fromRGB(100, 210, 80),
		normal = Color3.fromRGB(74, 144, 217),
	}

	local sLbl = Instance.new("TextLabel", row)
	sLbl.Size = UDim2.new(0, 130, 1, 0)
	sLbl.Position = UDim2.new(0, 8, 0, 0)
	sLbl.BackgroundTransparency = 1
	sLbl.Text = "[" .. (data.city or "RADIO") .. "] " .. (data.sender or "Unit")
	sLbl.TextColor3 = tc[data.type] or Color3.fromRGB(74, 144, 217)
	sLbl.TextSize = 10
	sLbl.Font = Enum.Font.GothamBold
	sLbl.TextXAlignment = Enum.TextXAlignment.Left

	local mLbl = Instance.new("TextLabel", row)
	mLbl.Size = UDim2.new(1, -145, 1, 0)
	mLbl.Position = UDim2.new(0, 140, 0, 0)
	mLbl.BackgroundTransparency = 1
	mLbl.Text = data.msg or ""
	mLbl.TextColor3 = Color3.fromRGB(220, 230, 245)
	mLbl.TextSize = 10
	mLbl.Font = Enum.Font.Gotham
	mLbl.TextXAlignment = Enum.TextXAlignment.Left
	mLbl.TextWrapped = true

	scroll.CanvasSize = UDim2.new(0, 0, 0, chatOrder * 46)
	scroll.CanvasPosition = Vector2.new(0, chatOrder * 46)
end)

-- ==========================================
-- BOOT SEQUENCE & INITIALIZATION
-- ==========================================
task.spawn(function()
	local ls = ui:FindFirstChild("LoadingScreen")
	if ls and ls.Visible then
		local bar = ls:FindFirstChild("LoadBar", true)
		local txt = ls:FindFirstChild("LoadText", true)
		local steps = {
			{p = 0.25, msg = "กำลังโหลดข้อมูลผู้การ... (Loading Commander Profile...)"},
			{p = 0.55, msg = "กำลังเชื่อมต่อแผนที่เมือง... (Synchronizing Vector Street Grid...)"},
			{p = 0.85, msg = "กำลังเปิดสัญญาณคู่สาย 911... (Establishing Trunk Lines...)"},
			{p = 1.00, msg = "ระบบศูนย์บัญชาการพร้อม! (Systems Operational!)"},
		}
		for _, s in ipairs(steps) do
			if bar then TS:Create(bar, TweenInfo.new(0.45), {Size = UDim2.new(s.p, 0, 1, 0)}):Play() end
			if txt then txt.Text = s.msg end
			task.wait(0.5)
		end
		TS:Create(ls, TweenInfo.new(0.4), {BackgroundTransparency = 1}):Play()
		task.delay(0.4, function() ls.Visible = false end)
	end

	if RF then
		local gpd = RF:FindFirstChild("GetPlayerData")
		if gpd then
			local ok, data = pcall(function() return gpd:InvokeServer() end)
			if ok and data then syncFullProfile(data) end
		end

		local gu = RF:FindFirstChild("GetUnits")
		if gu then
			local ok, units = pcall(function() return gu:InvokeServer() end)
			if ok and units then cachedUnits = units end
		end

		local gi = RF:FindFirstChild("GetIncidents")
		if gi then
			local ok, incs = pcall(function() return gi:InvokeServer() end)
			if ok and incs then
				for _, inc in ipairs(incs) do
					activeIncidents[inc.id] = inc
					addIncidentToVectorMap(inc)
				end
			end
		end
	end

	wireTopNavBarAndDashboard()
	wireIncomingCallModal()
	wireRewardModals()
	wireFleetShopAndChat()
	startLiveTickers()

	-- Set Dashboard as Default Main Screen!
	showFrame("dashboard")
	updateOfficerProfileUI()

	print("[ClientManager v9.0] AAA Dashboard & Vector City Map LIVE!")
end)
