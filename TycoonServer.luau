-- Nation Tycoon Server v1.0 - AAA Country Base Building & Economy Engine
-- Features:
-- 1. Plot Claiming & Country Buffs (🇹🇭 ประเทศไทย, 🇮🇩 อินโดนีเซีย, 🇯🇵 ญี่ปุ่น, 🇺🇸 สหรัฐอเมริกา)
-- 2. Real-Time Passive Rent Engine (ค่าเช่า/วินาที)
-- 3. Construction & 3D Building Placement on Plot Grids
-- 4. Crop Harvesting & Central Market Stall Selling (ร้านรับซื้อผลผลิต)
-- 5. DataStore Persistence & Offline Earnings Calculator
-- 6. Quick Action Signs (สร้างทั้งหมด, เก็บเกี่ยวทั้งหมด)

local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local TycoonDS = DataStoreService:GetDataStore("NationTycoon_v1")

local remotes = RS:WaitForChild("TycoonRemotes", 20)
local RE = {
    ClaimPlot = remotes:WaitForChild("ClaimPlot"),
    BuyBuilding = remotes:WaitForChild("BuyBuilding"),
    HarvestCrop = remotes:WaitForChild("HarvestCrop"),
    SellItems = remotes:WaitForChild("SellItems"),
    ClaimOffline = remotes:WaitForChild("ClaimOffline"),
    SyncTycoonData = remotes:WaitForChild("SyncTycoonData"),
    TycoonToast = remotes:WaitForChild("TycoonToast"),
    BuildAll = remotes:WaitForChild("BuildAll"),
    HarvestAll = remotes:WaitForChild("HarvestAll"),
}
local RF = {
    GetTycoonState = remotes:WaitForChild("GetTycoonState"),
}

local ws = game:GetService("Workspace")
local mapFolder = ws:WaitForChild("Map", 20)
local plotsFolder = mapFolder:WaitForChild("PlayerPlots", 20)

-- Player Data Cache
local playerData = {}

-- Building Templates Catalog
local BUILDING_CATALOG = {
    SmallHouse = {
        name = "บ้านขนาดเล็ก",
        cost = 95,
        rent = 8.5,
        citizens = 5,
        defense = 0,
        size = Vector3.new(12, 8, 10),
        color = Color3.fromRGB(190, 130, 70),
        roofColor = Color3.fromRGB(180, 50, 40),
    },
    FamilyHouse = {
        name = "บ้านครอบครัวขนาดเล็ก",
        cost = 237,
        rent = 22.0,
        citizens = 15,
        defense = 0,
        size = Vector3.new(16, 9, 14),
        color = Color3.fromRGB(220, 80, 60),
        roofColor = Color3.fromRGB(40, 50, 70),
    },
    ShotgunHouse = {
        name = "บ้านปืนลูกซอง",
        cost = 712,
        rent = 55.0,
        citizens = 40,
        defense = 1,
        size = Vector3.new(20, 10, 12),
        color = Color3.fromRGB(120, 140, 160),
        roofColor = Color3.fromRGB(70, 80, 95),
    },
    CornFarm = {
        name = "ฟาร์มข้าวโพด",
        cost = 150,
        rent = 12.0,
        citizens = 2,
        defense = 0,
        size = Vector3.new(16, 1, 16),
        color = Color3.fromRGB(90, 60, 35),
        cropType = "Corn",
        cropYield = 10,
    },
    WheatFarm = {
        name = "ฟาร์มข้าวสาลี",
        cost = 420,
        rent = 35.0,
        citizens = 4,
        defense = 0,
        size = Vector3.new(18, 1, 18),
        color = Color3.fromRGB(110, 75, 45),
        cropType = "Wheat",
        cropYield = 18,
    },
    Barracks = {
        name = "ค่ายทหารอาสา",
        cost = 850,
        rent = 15.0,
        citizens = 10,
        defense = 4,
        size = Vector3.new(18, 12, 14),
        color = Color3.fromRGB(50, 110, 70),
        roofColor = Color3.fromRGB(35, 75, 50),
    },
    AATurret = {
        name = "ป้อมปืนใหญ่ต่อสู้อากาศยาน",
        cost = 1500,
        rent = 5.0,
        citizens = 2,
        defense = 10,
        size = Vector3.new(10, 16, 10),
        color = Color3.fromRGB(60, 80, 120),
        roofColor = Color3.fromRGB(40, 50, 80),
    },
    Helipad = {
        name = "ลานจอดเฮลิคอปเตอร์รบ",
        cost = 3500,
        rent = 150.0,
        citizens = 8,
        defense = 8,
        size = Vector3.new(24, 2, 24),
        color = Color3.fromRGB(40, 45, 55),
        roofColor = Color3.fromRGB(240, 190, 30),
    },
}

-- Default Player State
local function createDefaultData()
    return {
        cash = 1000,
        citizens = 20,
        defense = 2,
        rentRate = 15.5,
        plotId = 0,
        countryName = "ประเทศไทย",
        countryFlag = "🇹🇭",
        buff = "+15% เงินสด • +2 ขนาดกองทัพ",
        inventory = {
            Corn = 15,
            Wheat = 0,
        },
        buildings = {
            {type = "SmallHouse", slot = 1},
            {type = "CornFarm", slot = 2},
        },
        offlineEarnings = 0,
        lastLeaveTime = os.time(),
    }
end

-- Sync Data to Client
local function syncClient(player)
    local data = playerData[player.UserId]
    if data then
        RE.SyncTycoonData:FireClient(player, data)
    end
end

-- Recalculate Stats (Rent, Citizens, Defense)
local function recalculateStats(player)
    local data = playerData[player.UserId]
    if not data then return end

    local totalRent = 0
    local totalCit = 0
    local totalDef = 0

    for _, b in ipairs(data.buildings) do
        local tmpl = BUILDING_CATALOG[b.type]
        if tmpl then
            totalRent = totalRent + (tmpl.rent or 0)
            totalCit = totalCit + (tmpl.citizens or 0)
            totalDef = totalDef + (tmpl.defense or 0)
        end
    end

    -- Country Buff (+15% cash)
    if data.buff:find("15%%") then
        totalRent = totalRent * 1.15
    end

    data.rentRate = math.max(5, math.floor(totalRent * 10) / 10)
    data.citizens = math.max(10, totalCit)
    data.defense = math.max(2, totalDef)
end

-- Assign / Claim Plot
local function assignPlot(player, targetPlotId)
    local data = playerData[player.UserId]
    if not data then return end

    -- Check available plots
    local chosenPlot = nil
    for _, plot in ipairs(plotsFolder:GetChildren()) do
        local pId = plot:GetAttribute("PlotId")
        local curOwner = plot:GetAttribute("OwnerUserId") or 0
        if curOwner == player.UserId then
            chosenPlot = plot
            break
        elseif curOwner == 0 and (targetPlotId == nil or targetPlotId == pId) then
            chosenPlot = plot
            if targetPlotId then break end
        end
    end

    if not chosenPlot then return end

    local pId = chosenPlot:GetAttribute("PlotId")
    data.plotId = pId
    data.countryName = chosenPlot:GetAttribute("CountryName") or "ประเทศไทย"
    data.countryFlag = chosenPlot:GetAttribute("CountryFlag") or "🇹🇭"
    data.buff = chosenPlot:GetAttribute("Buff") or "+15% เงินสด"

    chosenPlot:SetAttribute("OwnerUserId", player.UserId)
    chosenPlot:SetAttribute("OwnerName", player.DisplayName)

    -- Update Billboard
    local flagPole = chosenPlot:FindFirstChild("FlagPole")
    local bb = flagPole and flagPole:FindFirstChild("PlotInfoGui")
    if bb then
        local oLbl = bb:FindFirstChild("OwnerLbl")
        if oLbl then
            oLbl.Text = "ผู้ครอบครอง: " .. player.DisplayName
            oLbl.TextColor3 = Color3.fromRGB(0, 240, 120)
        end
    end

    recalculateStats(player)
    syncClient(player)

    RE.TycoonToast:FireClient(player, {
        type = "success",
        title = "🏳️ ครอบครองดินแดนสำเร็จ!",
        msg = "คุณเป็นผู้นำของ " .. data.countryFlag .. " " .. data.countryName,
    })
end

-- Build 3D Model on Plot Grid
local function spawnBuildingOnPlot(plot, bType, slotIndex)
    local tmpl = BUILDING_CATALOG[bType]
    if not tmpl then return end

    local plotGround = plot:FindFirstChild("PlotGround")
    if not plotGround then return end

    -- Grid positioning: 4x4 slots on plot
    local row = math.floor((slotIndex - 1) / 4)
    local col = (slotIndex - 1) % 4
    local xOff = -35 + col * 24
    local zOff = -35 + row * 24

    local bPos = plotGround.Position + Vector3.new(xOff, tmpl.size.Y / 2 + 2, zOff)

    local model = Instance.new("Model")
    model.Name = "Bld_" .. bType .. "_" .. slotIndex
    model:SetAttribute("BuildingType", bType)
    model:SetAttribute("Slot", slotIndex)
    model.Parent = plot

    local body = Instance.new("Part")
    body.Name = "Body"
    body.Size = tmpl.size
    body.Position = bPos
    body.Anchored = true
    body.Color = tmpl.color
    body.Material = (tmpl.cropType and Enum.Material.Ground) or Enum.Material.WoodPlanks
    body.Parent = model

    if tmpl.roofColor then
        local roof = Instance.new("Part")
        roof.Name = "Roof"
        roof.Size = Vector3.new(tmpl.size.X + 2, 3, tmpl.size.Z + 2)
        roof.Position = bPos + Vector3.new(0, tmpl.size.Y / 2 + 1.5, 0)
        roof.Anchored = true
        roof.Color = tmpl.roofColor
        roof.Material = Enum.Material.WoodPlanks
        roof.Parent = model
    end

    -- Floating Billboard
    local bb = Instance.new("BillboardGui")
    bb.Size = UDim2.new(0, 130, 0, 36)
    bb.StudsOffset = Vector3.new(0, tmpl.size.Y / 2 + 4, 0)
    bb.AlwaysOnTop = true
    bb.MaxDistance = 100
    bb.Parent = body

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(1, 0, 1, 0)
    lbl.BackgroundTransparency = 1
    lbl.Font = Enum.Font.GothamBold
    lbl.TextSize = 12
    lbl.TextColor3 = Color3.fromRGB(255, 240, 120)
    lbl.Text = tmpl.name .. string.char(10) .. "+$" .. tostring(tmpl.rent or 0) .. "/วินาที"
    lbl.Parent = bb

    return model
end

-- ==========================================
-- REMOTE EVENT HANDLERS
-- ==========================================

-- 1. Buy Building
RE.BuyBuilding.OnServerEvent:Connect(function(player, bType)
    local data = playerData[player.UserId]
    if not data then return end
    local tmpl = BUILDING_CATALOG[bType]
    if not tmpl then return end

    if data.cash < tmpl.cost then
        RE.TycoonToast:FireClient(player, {
            type = "error",
            title = "⚠️ เงินไม่พอ!",
            msg = "ต้องการเงิน $" .. tmpl.cost .. " เพื่อสร้าง " .. tmpl.name,
        })
        return
    end

    -- Check slot capacity (max 16 slots per plot)
    if #data.buildings >= 16 then
        RE.TycoonToast:FireClient(player, {
            type = "error",
            title = "⚠️ พื้นที่เต็ม!",
            msg = "ดินแดนของคุณเต็มแล้ว โปรดขยายขนาดที่ดินในอนาคต",
        })
        return
    end

    data.cash = data.cash - tmpl.cost
    local nextSlot = #data.buildings + 1
    table.insert(data.buildings, {type = bType, slot = nextSlot})

    -- Find plot and spawn 3D model
    local plot = plotsFolder:FindFirstChild("Plot_" .. data.plotId)
    if plot then
        spawnBuildingOnPlot(plot, bType, nextSlot)
    end

    recalculateStats(player)
    syncClient(player)

    RE.TycoonToast:FireClient(player, {
        type = "success",
        title = "🏗️ ก่อสร้างสำเร็จ!",
        msg = tmpl.name .. " เพิ่มค่าเช่า +$" .. tmpl.rent .. "/วินาที",
    })
end)

-- 2. Harvest Crops
RE.HarvestCrop.OnServerEvent:Connect(function(player, cropType)
    local data = playerData[player.UserId]
    if not data then return end

    cropType = cropType or "Corn"
    local count = 12
    data.inventory[cropType] = (data.inventory[cropType] or 0) + count

    syncClient(player)
    RE.TycoonToast:FireClient(player, {
        type = "success",
        title = "🌾 เก็บเกี่ยวผลผลิต!",
        msg = "ได้รับ " .. cropType .. " x" .. count .. " เก็บไว้ในกระเป๋าแล้ว",
    })
end)

-- 3. Sell Items at Market Stall
RE.SellItems.OnServerEvent:Connect(function(player, mode)
    local data = playerData[player.UserId]
    if not data then return end

    local cropPrices = {Corn = 45, Wheat = 90}
    local totalSold = 0
    local totalEarnings = 0

    for item, qty in pairs(data.inventory) do
        if qty > 0 and cropPrices[item] then
            local toSell = (mode == "held") and math.min(qty, 5) or qty
            local earned = toSell * cropPrices[item]
            totalSold = totalSold + toSell
            totalEarnings = totalEarnings + earned
            data.inventory[item] = data.inventory[item] - toSell
        end
    end

    if totalEarnings > 0 then
        -- Country Buff
        if data.buff:find("15%%") then
            totalEarnings = math.floor(totalEarnings * 1.15)
        end
        data.cash = data.cash + totalEarnings
        syncClient(player)

        RE.TycoonToast:FireClient(player, {
            type = "purchase",
            title = "💰 ขายสินค้าสำเร็จ!",
            msg = "ขายผลผลิต " .. totalSold .. " ชิ้น ได้เงิน +$" .. string.format("%d", totalEarnings),
        })
    else
        RE.TycoonToast:FireClient(player, {
            type = "info",
            title = "📦 ไม่มีผลผลิตให้ขาย",
            msg = "ไปเก็บเกี่ยวที่ฟาร์มก่อน หรือรอผลผลิตโตเต็มที่",
        })
    end
end)

-- 4. Claim Offline Earnings
RE.ClaimOffline.OnServerEvent:Connect(function(player)
    local data = playerData[player.UserId]
    if not data then return end

    if data.offlineEarnings > 0 then
        local amt = data.offlineEarnings
        data.cash = data.cash + amt
        data.offlineEarnings = 0
        syncClient(player)

        RE.TycoonToast:FireClient(player, {
            type = "success",
            title = "⚡ รับรายได้ออฟไลน์สำเร็จ!",
            msg = "+$" .. string.format("%d", amt) .. " 💵 เพิ่มเข้าสู่บัญชีของคุณแล้ว",
        })
    end
end)

-- 5. Quick Actions: Build All / Harvest All
RE.BuildAll.OnServerEvent:Connect(function(player)
    local data = playerData[player.UserId]
    if not data then return end

    local availableTypes = {"SmallHouse", "FamilyHouse", "CornFarm", "Barracks"}
    local builtCount = 0
    for _, bType in ipairs(availableTypes) do
        local tmpl = BUILDING_CATALOG[bType]
        if tmpl and data.cash >= tmpl.cost and #data.buildings < 16 then
            data.cash = data.cash - tmpl.cost
            local nextSlot = #data.buildings + 1
            table.insert(data.buildings, {type = bType, slot = nextSlot})
            local plot = plotsFolder:FindFirstChild("Plot_" .. data.plotId)
            if plot then spawnBuildingOnPlot(plot, bType, nextSlot) end
            builtCount = builtCount + 1
        end
    end

    if builtCount > 0 then
        recalculateStats(player)
        syncClient(player)
        RE.TycoonToast:FireClient(player, {
            type = "success",
            title = "⚡ สร้างทั้งหมดสำเร็จ!",
            msg = "สร้างสิ่งปลูกสร้างใหม่ " .. builtCount .. " แห่ง",
        })
    end
end)

RE.HarvestAll.OnServerEvent:Connect(function(player)
    local data = playerData[player.UserId]
    if not data then return end

    local gained = 24
    data.inventory.Corn = (data.inventory.Corn or 0) + gained
    syncClient(player)
    RE.TycoonToast:FireClient(player, {
        type = "success",
        title = "🌾 เก็บเกี่ยวผลผลิตทั้งหมดแล้ว!",
        msg = "เก็บเกี่ยวข้าวโพดและผลผลิตเข้าสู่คลังสินค้าสำเร็จ",
    })
end)

-- 6. Claim Plot Remote
RE.ClaimPlot.OnServerEvent:Connect(function(player, plotId)
    assignPlot(player, plotId)
end)

-- RemoteFunction: GetTycoonState
RF.GetTycoonState.OnServerInvoke = function(player)
    return playerData[player.UserId] or createDefaultData()
end

-- ==========================================
-- PASSIVE INCOME ENGINE (1-Second Tick Loop)
-- ==========================================
task.spawn(function()
    while true do
        task.wait(1)
        for _, player in ipairs(Players:GetPlayers()) do
            local data = playerData[player.UserId]
            if data and data.plotId > 0 then
                data.cash = data.cash + data.rentRate
                syncClient(player)
            end
        end
    end
end)

-- ==========================================
-- PROXIMITY PROMPT LISTENERS (Market Stall & Farms)
-- ==========================================
game:GetService("ProximityPromptService").PromptTriggered:Connect(function(prompt, player)
    local parent = prompt.Parent
    if not parent then return end

    if parent.Name == "Counter" or parent.Name == "SellingStall" then
        -- Open Sell Dialog on Client
        RE.TycoonToast:FireClient(player, {
            type = "info",
            title = "🏪 ร้านรับซื้อผลผลิต",
            msg = "เปิดเมนูขายเพื่อแลกผลผลิตเป็นเงินสด",
        })
    elseif parent.Name == "FarmSoil" or parent.Name:find("Farm") then
        local data = playerData[player.UserId]
        if data then
            data.inventory.Corn = (data.inventory.Corn or 0) + 12
            syncClient(player)
            RE.TycoonToast:FireClient(player, {
                type = "success",
                title = "🌽 เก็บเกี่ยวสำเร็จ!",
                msg = "ได้รับข้าวโพด x12 นำไปขายที่ร้านรับซื้อผลผลิตได้",
            })
        end
    elseif parent.Name == "SignBuildAll" then
        RE.BuildAll:FireClient(player)
    elseif parent.Name == "SignHarvestAll" then
        local data = playerData[player.UserId]
        if data then
            data.inventory.Corn = (data.inventory.Corn or 0) + 20
            syncClient(player)
        end
    end
end)

-- ==========================================
-- PLAYER JOIN & LEAVE (DataStore & Offline Calc)
-- ==========================================
Players.PlayerAdded:Connect(function(player)
    local key = "Player_" .. player.UserId
    local saved = nil
    pcall(function()
        saved = TycoonDS:GetAsync(key)
    end)

    local data = saved or createDefaultData()
    data.inventory = data.inventory or {Corn = 15, Wheat = 0}
    data.buildings = data.buildings or {{type = "SmallHouse", slot = 1}, {type = "CornFarm", slot = 2}}

    -- Calculate Offline Earnings
    local now = os.time()
    local elapsed = math.min(86400, math.max(0, now - (data.lastLeaveTime or now)))
    if elapsed > 60 then
        local rate = data.rentRate or 15.5
        local offlineAmt = math.floor(elapsed * rate * 0.7)
        data.offlineEarnings = offlineAmt
    else
        data.offlineEarnings = 0
    end
    data.lastLeaveTime = now

    playerData[player.UserId] = data

    -- Auto-assign Plot
    task.delay(1.5, function()
        if player and player.Parent then
            assignPlot(player)
        end
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    local data = playerData[player.UserId]
    if data then
        data.lastLeaveTime = os.time()
        pcall(function()
            TycoonDS:SetAsync("Player_" .. player.UserId, data)
        end)

        -- Free up plot
        if data.plotId > 0 then
            local plot = plotsFolder:FindFirstChild("Plot_" .. data.plotId)
            if plot then
                plot:SetAttribute("OwnerUserId", 0)
                plot:SetAttribute("OwnerName", "ว่าง (Unclaimed)")
                local flagPole = plot:FindFirstChild("FlagPole")
                local bb = flagPole and flagPole:FindFirstChild("PlotInfoGui")
                if bb then
                    local oLbl = bb:FindFirstChild("OwnerLbl")
                    if oLbl then
                        oLbl.Text = "ผู้ครอบครอง: [ว่าง / แตะเพื่อยึด]"
                        oLbl.TextColor3 = Color3.fromRGB(240, 210, 60)
                    end
                end
            end
        end

        playerData[player.UserId] = nil
    end
end)

print("[TycoonServer v1.0] Nation Tycoon Engine Initialized & Active!")
