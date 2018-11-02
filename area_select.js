/**
 * 构建三级联动
 * @param selector: css 选择器，如：".area1"
 * @param selected_code: 已选中的代码，可以是 省、市、区 代码，如：420106，也可以为空
 */
function area_select(selector, selected_code) {

	var $area = $(selector);
	var $province = $area.find('select[name="province"]');
	var $city = $area.find('select[name="city"]');
	var $county = $area.find('select[name="county"]');

	var upper_areas = get_upper_areas(selected_code);
	var province_code = !!upper_areas[0] ? upper_areas[0] : '';
	var city_code = !!upper_areas[1] ? upper_areas[1] : '';
	var county_code = !!upper_areas[2] ? upper_areas[2] : '';

	$province.html(get_area_options(provinces, province_code));

	if (province_code) {
		$city.html(get_area_options(get_sub_areas(province_code), city_code));
		if (city_code) {
			$county.html(get_area_options(get_sub_areas(city_code), county_code));
		}
	}

	$area.find('select').change(function () {
		var code = $(this).val();
		var area_name = $(this).attr('name');
		if (area_name == "province") {
			$city.html(get_area_options(get_sub_areas(code)));
			$county.html('<option value=""></option>');
		}
		if (area_name == "city") {
			$county.html(get_area_options(get_sub_areas(code)));
		}
	});
}

var areas_tree_level3 = [];

/**
 * 构建 三级 树数组
 * 注：北京、天津等直辖市只有 市/区 二级结构，其他省有 省/市/区县 三级结构
 * @return Array
 */
function areas_tree3() {

	if (areas_tree_level3.length > 1) {
		return areas_tree_level3;
	}
	var regexp = /(\d{2})(\d{2})(\d{2})/;
	for (var code in areas) {
		var arr = code.match(regexp);
		if (arr[2] + arr[3] == '0000') { //省
			areas_tree_level3[code] = [];
		}
		else if (arr[3] == '00') { //市
			areas_tree_level3[arr[1] + '0000'][code] = [];
		}
		else { //区
			if (typeof areas[arr[1] + arr[2] + '00'] == 'undefined') { //直辖市下面的区
				areas_tree_level3[arr[1] + '0000'][code] = [];
			}
			else {
				if (!areas_tree_level3[arr[1] + '0000'][arr[1] + arr[2] + '00']) {
					areas_tree_level3[arr[1] + '0000'][arr[1] + arr[2] + '00'] = [];
				}
				areas_tree_level3[arr[1] + '0000'][arr[1] + arr[2] + '00'].push(code);
			}
		}
	}
	return areas_tree_level3;
}

/**
 * 根据代码列表，生成下拉选项
 */
function get_area_options(codes, select_code) {

	var option = '<option value=""></option>';

	if (codes.length < 1) {
		return option;
	}

	var code = "", selected = "";

	for (var i in codes) {
		code = codes[i];
		selected = code == select_code ? " selected" : "";
		option += '<option value="' + code + '"' + selected + '>' + get_area_name(code) + '</option>' + "\n";
	}

	return option;
}

/**
 * 获取一个代码的地区名称
 * @param code
 * @param unknown
 * @return string area_name
 * 如果代码没匹配到，就尝试返回它的上级地区名，如果一直匹配不到就返回 unknown
 */
function get_area_name(code, unknown) {

	if (!!areas[code]) {
		return areas[code];
	}

	unknown = unknown ? unknown : "未知";

	code = code + "";
	var regexp = /^(\d{2})(\d{2})(\d{2})$/;
	var arr = code.match(regexp);

	if (!arr || arr[1] < 11 || arr[1] > 82) {
		return unknown;
	}

	if (!!areas[arr[1] + arr[2] + '00']) {
		return areas[arr[1] + arr[2] + '00'];
	}
	if (!!areas[arr[1] + '0000']) {
		return areas[arr[1] + '0000'];
	}

	return unknown;
}

/**
 * 获取一个代码的 省、市、区 名称
 * @param code
 * @returns {string}
 * 如：湖北省 武汉市 武昌区
 */
function get_area_names(code) {

	var names = [];
	var upper_areas = get_upper_areas(code);
	for (var i in upper_areas) {
		names[i] = get_area_name(upper_areas[i]);
	}
	return names.join(" ");
}

/**
 * 获取上级、上上级地区代码，包含自己
 * @param code
 * @returns {*}
 * [省级代码, 市级代码, 区级代码]，如：["110000", "110101"] 或 ["130000", "130100", "130102"]
 */
function get_upper_areas(code) {

	code = code + "";

	if (!code || code == "0" || code == "000000") {
		return [];
	}

	var regexp = /^(\d{2})(\d{2})(\d{2})$/;
	var arr = code.match(regexp);

	if (!arr || arr[1] < 11 || arr[1] > 82) {
		return [];
	}

	var res = [];

	if (arr[2] + arr[3] == "0000") {
		res = [code];
	}
	else if (arr[3] == "00") {
		res = [arr[1] + "0000", code];
	}
	else {
		if (typeof areas[arr[1] + arr[2] + '00'] == 'undefined') {
			res = [arr[1] + "0000", code];
		}
		else {
			res = [arr[1] + "0000", arr[1] + arr[2] + "00", code];
		}
	}

	return res;
}

/**
 * 获取同级地区代码，包含自己
 * @param code
 * @returns {Array}
 * 如：["110101", "110102", "110105", ...]
 */
function get_sib_areas(code) {

	code = code + "";

	if (!code || code == "0" || code == "000000") {
		return [];
	}

	var regexp = /^(\d{2})(\d{2})(\d{2})$/;
	var arr = code.match(regexp);

	if (!arr || arr[1] < 11 || arr[1] > 82) {
		return [];
	}

	var res = [];

	if (arr[2] + arr[3] == "0000") {
		res = provinces;
	}
	else if (arr[3] == "00") {
		var areas_tree = areas_tree3();
		for (var _code in areas_tree[arr[1] + "0000"]) {
			res.push(_code);
		}
	}
	else {
		var areas_tree = areas_tree3();
		res = areas_tree[arr[1] + "0000"][arr[1] + arr[2] + "00"];
	}

	return res;
}

/**
 * 获取下一级地区代码，不包含自己
 * @param code
 * @returns {*}
 * 如：["110101", "110102", "110105", ...]
 */
function get_sub_areas(code) {

	code = code + "";

	if (code == "") {
		return [];
	}
	else if (code == "0" || code == "000000") {
		return provinces;
	}

	var regexp = /^(\d{2})(\d{2})(\d{2})$/;
	var arr = code.match(regexp);

	if (!arr || arr[1] < 11 || arr[1] > 82) {
		return [];
	}

	var res = [];
	var areas_tree = areas_tree3();

	if (arr[2] + arr[3] == "0000") {
		for (var _code in areas_tree[arr[1] + "0000"]) {
			res.push(_code);
		}
	}
	else if (arr[3] == "00") {
		res = areas_tree[arr[1] + "0000"][code];
	}

	return res;
}
